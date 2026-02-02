from __future__ import annotations

import re
import uuid

from PyQt6.QtCore import Qt, QEvent, QTimer, pyqtSignal
from PyQt6.QtGui import QColor, QTextCharFormat, QTextCursor, QTextFormat
from PyQt6.QtWidgets import QSizePolicy, QTextEdit, QTextBrowser, QWidget

from .base import BaseBlock, ClickablePreview
from .checkbox_render import get_checkbox_positions, render_checkboxes
from .config_loader import load_block_defaults
from .highlighter import EmbeddedTableHighlighter
from .markdown_render import render_markdown


class TextBlock(BaseBlock):
    table_insert_requested = pyqtSignal(QWidget, str, dict, str)

    def __init__(self, content: str | dict = "", theme_manager=None):
        super().__init__()
        defaults = load_block_defaults().get("TextBlock", {})
        self.theme_manager = theme_manager
        self.preview_interactive = True
        self.tables: dict = {}
        self._embedded_spans = []
        self._placeholder_selections = []

        self.edit = QTextEdit()
        self.edit.setPlaceholderText(defaults.get("placeholder", "Escribe algo o pulsa '/' para comandos..."))
        self.edit.setAcceptRichText(False)
        self.edit.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.edit.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        self.edit.setFocusPolicy(Qt.FocusPolicy.StrongFocus)
        self.edit.setReadOnly(False)
        self.edit.setMinimumHeight(int(defaults.get("min_height", "100")))

        self.preview = ClickablePreview()
        self.preview.setOpenExternalLinks(False)
        self.preview.setOpenLinks(False)
        self.preview.setFrameShape(QTextBrowser.Shape.NoFrame)
        self.preview.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        self.preview.setCursor(Qt.CursorShape.IBeamCursor)
        self.preview.clicked.connect(self.focus_in)
        self.preview.link_clicked.connect(self._on_preview_link_clicked)
        try:
            self.preview.setLineWrapMode(QTextBrowser.LineWrapMode.WidgetWidth)
        except Exception:
            self.preview.setLineWrapMode(1)

        self.layout.addWidget(self.preview)
        self.layout.addWidget(self.edit)

        self._embedded_update_timer = QTimer(self)
        self._embedded_update_timer.setSingleShot(True)
        self._embedded_update_timer.timeout.connect(self._refresh_embedded_spans)

        self.edit.installEventFilter(self)
        self.preview.installEventFilter(self)
        self.edit.textChanged.connect(self._on_text_changed)

        self._highlighter = EmbeddedTableHighlighter(self.edit.document(), self.theme_manager)

        from ..slash_menu import SlashMenu

        self.slash_menu = SlashMenu(self)
        self.slash_menu.command_selected.connect(self.handle_slash_command)
        self.slash_menu.hide()

        if isinstance(content, dict):
            self.set_data({"content": content})
        else:
            self.set_data({"content": content})

    def _on_text_changed(self):
        self._normalize_tables_in_text()
        if not self._embedded_update_timer.isActive():
            self._embedded_update_timer.start(80)
        self.content_changed.emit()

    def eventFilter(self, obj, event):
        if obj is self.edit:
            if event.type() == QEvent.Type.FocusIn:
                self.got_focus.emit(self)
            elif event.type() == QEvent.Type.FocusOut:
                self.update_preview()
                self.show_preview()
            elif event.type() == QEvent.Type.KeyPress:
                key_event = event
                if key_event.key() == Qt.Key.Key_Return and key_event.modifiers() & Qt.KeyboardModifier.ControlModifier:
                    self._request_split()
                    return True

                if key_event.key() == Qt.Key.Key_Backspace:
                    cursor = self.edit.textCursor()
                    if cursor.atStart() and not cursor.hasSelection():
                        self.delete_requested.emit(self)
                        return True

                if key_event.key() in (Qt.Key.Key_Backspace, Qt.Key.Key_Delete):
                    pos = self.edit.textCursor().position()
                    if self._selection_overlaps_embedded() or self._cursor_in_embedded(pos):
                        self._move_cursor_out_of_embedded()
                        return True

                text = key_event.text()
                if text == "/" and self._can_trigger_slash():
                    cursor_rect = self.edit.cursorRect()
                    pos = self.edit.mapToGlobal(cursor_rect.bottomLeft())
                    self.slash_menu.show_at_cursor(pos)
                    return False

                if key_event.key() == Qt.Key.Key_Escape and self.slash_menu.isVisible():
                    self.slash_menu.hide()
                    return True

                if key_event.key() == Qt.Key.Key_Return and not key_event.modifiers():
                    cursor = self.edit.textCursor()
                    block_text = cursor.block().text()
                    m = re.match(r"^(\s*)([-*+]|\d+\.)\s*(.*)", block_text)
                    if m:
                        indent, marker, rest = m.groups()
                        if rest.strip() == "":
                            start = cursor.block().position() + len(indent)
                            cursor.setPosition(start)
                            end_pos = start + len(marker)
                            cursor.setPosition(end_pos, QTextCursor.MoveMode.KeepAnchor)
                            cursor.removeSelectedText()
                            self.content_changed.emit()
                            return False
                        else:
                            insert = "\n" + indent + marker + " "
                            cursor.insertText(insert)
                            self.content_changed.emit()
                            return True

        return super().eventFilter(obj, event)

    def _request_split(self):
        cursor = self.edit.textCursor()
        text = self.edit.toPlainText()
        pos = cursor.position()
        before = text[:pos]
        after = text[pos:]
        self.edit.setPlainText(before)
        self.update_preview()
        self.show_preview()
        self.set_interactive(False)
        self.split_requested.emit(self, after)

    def _can_trigger_slash(self) -> bool:
        cursor = self.edit.textCursor()
        pos = cursor.position()
        cursor.movePosition(QTextCursor.MoveOperation.StartOfLine)
        cursor.setPosition(pos, QTextCursor.MoveMode.KeepAnchor)
        line_before = cursor.selectedText().strip()
        cursor.setPosition(pos)
        self.edit.setTextCursor(cursor)
        return len(line_before) == 0

    def focus_in(self):
        self.preview.hide()
        self.edit.show()
        self.edit.setFocus()
        cursor = self.edit.textCursor()
        cursor.movePosition(QTextCursor.MoveOperation.End)
        self.edit.setTextCursor(cursor)

    def show_preview(self):
        self.edit.hide()
        self.preview.show()

    def _on_preview_link_clicked(self, href: str, pos):
        if not self.preview_interactive:
            return
        if href.startswith("task:"):
            try:
                idx = int(href.split(":", 1)[1])
            except Exception:
                return
            self._toggle_checkbox_at(idx)

    def _toggle_checkbox_at(self, idx: int):
        text = self.edit.toPlainText()
        positions = get_checkbox_positions(text)
        if idx < 0 or idx >= len(positions):
            return
        start, end, checked = positions[idx]
        replacement = "[ ]" if checked else "[x]"
        new_text = text[:start] + replacement + text[end:]
        self.edit.setPlainText(new_text)
        self.update_preview()
        self.content_changed.emit()

    def update_preview(self):
        text = self.edit.toPlainText()
        if not text or not text.strip():
            self.preview.setHtml('<div style="color:#888;padding:10px;">Escribe algo... (click para editar)</div>')
            self.preview.setFixedHeight(40)
            return

        text_with_tables, _ = self._render_embedded_tables(text)
        html_body = render_markdown(text_with_tables)
        html_body = render_checkboxes(html_body)

        text_color = "#e0e0e0"
        bg_secondary = "#1e1e1e"
        bg_hover = "#252525"
        border_color = "#444"
        th_bg = "#2a2a2a"
        th_text = "#e0e0e0"

        if self.theme_manager:
            theme = self.theme_manager.get_current_theme()
            if theme and "colors" in theme:
                c = theme["colors"]
                text_color = c.get("text_main", text_color)
                bg_secondary = c.get("background_secondary", bg_secondary)
                bg_hover = c.get("block_hover", bg_hover)
                border_color = c.get("border", border_color)
                th_bg = c.get("background_secondary", th_bg)
                th_text = c.get("text_main", th_text)

        full_html = f"""
        <html><head><meta charset=\"utf-8\">
        <style>
            body {{ font-family: 'Inter', 'Segoe UI', sans-serif; color: {text_color}; background: transparent; 
                   font-size: 14px; line-height: 1.6; margin: 8px; }}
            pre {{ background: {bg_secondary}; padding: 12px; border-radius: 6px; overflow-x: auto; 
                  border: 1px solid {border_color}; }}
            code {{ background: {bg_secondary}; padding: 2px 6px; border-radius: 3px; 
                   font-family: 'Fira Code', 'Consolas', monospace; font-size: 13px; }}
            pre code {{ background: transparent; padding: 0; }}
            table {{ border-collapse: collapse; width: 100%; margin: 10px 0; }}
            th, td {{ border: 1px solid {border_color}; padding: 8px 12px; text-align: left; color: {text_color}; }}
            th {{ background: {th_bg}; font-weight: bold; color: {th_text}; }}
            tr:hover {{ background: {bg_hover}; }}
            blockquote {{ border-left: 3px solid #8a2be2; padding-left: 12px; margin: 10px 0; 
                         color: #aaa; font-style: italic; }}
            a {{ color: #8a2be2; text-decoration: none; }}
            a:hover {{ text-decoration: underline; }}
            a.ref {{ color: #9b59b6; font-weight: 500; }}
            a.cell-link {{ text-decoration: none; color: {text_color}; cursor: text; display: block; padding: 4px; min-height: 16px; }}
            h1, h2, h3, h4, h5, h6 {{ margin: 16px 0 8px 0; }}
            h1 {{ font-size: 2em; border-bottom: 2px solid {border_color}; padding-bottom: 4px; }}
            h2 {{ font-size: 1.5em; border-bottom: 1px solid {border_color}; padding-bottom: 3px; }}
            ul, ol {{ margin: 8px 0; padding-left: 24px; }}
            li {{ margin: 4px 0; }}
            li.task-item {{ list-style-type: none; margin-left: -18px; }}
            a.task-link {{ text-decoration: none; font-size: 1.1em; vertical-align: middle; }}
            a.task-link.checked {{ color: #4a7c4e !important; }}
            a.task-link.unchecked {{ color: #888 !important; }}
        </style>
        </head><body>{html_body}</body></html>
        """

        self.preview.setHtml(full_html)
        try:
            width = self.preview.viewport().width() or self.preview.width() or 600
            self.preview.document().setTextWidth(max(100, width - 10))
        except Exception:
            pass
        doc_height = self.preview.document().size().height()
        self.preview.setFixedHeight(int(doc_height) + 15)

    def apply_theme(self):
        self.update_preview()
        try:
            self._highlighter.update_colors(self.theme_manager)
        except Exception:
            pass
        self._update_table_placeholders()

    def _build_table_marker(self, table_id: str) -> str:
        return f"<!--table:{table_id}-->"

    def _refresh_embedded_spans(self):
        text = self.edit.toPlainText()
        self._embedded_spans = []
        for m in re.finditer(r"<!--table:(.*?)-->", text, flags=re.S):
            self._embedded_spans.append((m.start(), m.end()))
        self._update_table_placeholders()

    def _normalize_tables_in_text(self):
        text = self.edit.toPlainText()

        def ensure_entry(match):
            table_id = match.group(1).strip()
            if table_id and table_id not in self.tables:
                self.tables[table_id] = {"id": table_id, "header": [], "rows": []}
            return match.group(0)

        new_text = re.sub(r"<!--table:(.*?)-->", ensure_entry, text)
        if new_text != text:
            self.edit.blockSignals(True)
            self.edit.setPlainText(new_text)
            self.edit.blockSignals(False)
        return self.edit.toPlainText()

    def _build_segments_from_text(self, text: str) -> list:
        if not isinstance(text, str):
            return []
        segments = []
        last = 0
        for m in re.finditer(r"<!--table:(.*?)-->", text, flags=re.S):
            before = text[last:m.start()]
            if before:
                if segments and segments[-1].get("type") == "text":
                    segments[-1]["text"] += before
                else:
                    segments.append({"type": "text", "text": before})
            table_id = m.group(1).strip()
            table_data = self.tables.get(table_id, {"id": table_id, "header": [], "rows": []})
            normalized_table = {
                "id": table_id,
                "header": table_data.get("header", []),
                "rows": table_data.get("rows", []),
            }
            self.tables[table_id] = normalized_table
            segments.append({
                "type": "table",
                "id": table_id,
                "header": normalized_table["header"],
                "rows": normalized_table["rows"],
            })
            last = m.end()
        tail = text[last:]
        if tail:
            if segments and segments[-1].get("type") == "text":
                segments[-1]["text"] += tail
            else:
                segments.append({"type": "text", "text": tail})
        return segments

    def _load_from_segments(self, segments: list):
        if not isinstance(segments, list):
            self.edit.setPlainText("")
            return
        parts = []
        self.tables = {}
        for seg in segments:
            if not isinstance(seg, dict):
                continue
            seg_type = seg.get("type")
            if seg_type == "text":
                parts.append(str(seg.get("text", "")))
            elif seg_type == "table":
                table_id = seg.get("id") or uuid.uuid4().hex
                header = seg.get("header", []) or []
                rows = seg.get("rows", []) or []
                self.tables[table_id] = {"id": table_id, "header": header, "rows": rows}
                parts.append(self._build_table_marker(table_id))
        composed = "".join(parts)
        self.edit.setPlainText(composed)
        self._normalize_tables_in_text()

    def _cursor_in_embedded(self, pos: int) -> bool:
        for start, end in self._embedded_spans:
            if start < pos < end:
                return True
        return False

    def _selection_overlaps_embedded(self) -> bool:
        cursor = self.edit.textCursor()
        if not cursor.hasSelection():
            return False
        a, b = cursor.selectionStart(), cursor.selectionEnd()
        for start, end in self._embedded_spans:
            if not (b <= start or a >= end):
                return True
        return False

    def _move_cursor_out_of_embedded(self):
        cursor = self.edit.textCursor()
        pos = cursor.position()
        for start, end in self._embedded_spans:
            if start < pos < end:
                cursor.setPosition(end)
                self.edit.setTextCursor(cursor)
                return
            if pos == start:
                cursor.setPosition(start)
                self.edit.setTextCursor(cursor)
                return

    def _update_table_placeholders(self):
        if not hasattr(self, "edit"):
            return

        bg = QColor(80, 80, 80, 70)
        fg = QColor(0, 0, 0, 0)
        border = QColor(120, 120, 120, 90)
        if self.theme_manager:
            theme = self.theme_manager.get_current_theme()
            if theme and "colors" in theme:
                c = theme["colors"]
                try:
                    bg = QColor(c.get("background_secondary", "#444"))
                    bg.setAlpha(50)
                except Exception:
                    pass
                try:
                    fg = QColor(c.get("background_secondary", "#000"))
                    fg.setAlpha(0)
                except Exception:
                    pass
                try:
                    border = QColor(c.get("border", "#666"))
                    border.setAlpha(110)
                except Exception:
                    border = QColor(120, 120, 120, 90)

        selections = []
        for start, end in self._embedded_spans:
            sel = QTextEdit.ExtraSelection()
            cursor = self.edit.textCursor()
            cursor.setPosition(start)
            cursor.setPosition(end, QTextCursor.MoveMode.KeepAnchor)
            sel.cursor = cursor
            fmt = QTextCharFormat()
            fmt.setBackground(bg)
            fmt.setForeground(fg)
            fmt.setProperty(QTextFormat.Property.FullWidthSelection, True)
            if border:
                fmt.setUnderlineStyle(QTextCharFormat.UnderlineStyle.SingleUnderline)
                fmt.setUnderlineColor(border)
            sel.format = fmt
            selections.append(sel)

        self._placeholder_selections = selections
        self.edit.setExtraSelections(self._placeholder_selections)

    def _render_embedded_tables(self, text: str):
        tables = []
        parts = []
        last = 0
        for m in re.finditer(r"<!--table:(.*?)-->", text, flags=re.S):
            parts.append(text[last:m.start()])
            table_id = m.group(1).strip()
            data = self.tables.get(table_id, {"id": table_id, "header": [], "rows": []})
            data["id"] = table_id
            table_idx = len(tables)
            tables.append({"type": "embedded", "start": m.start(), "end": m.end(), "id": table_id, "data": data})
            parts.append(self._embedded_table_to_html(table_idx, data))
            last = m.end()
        parts.append(text[last:])
        return "".join(parts), tables

    def _embedded_table_to_html(self, table_idx: int, data: dict) -> str:
        header = data.get("header", [])
        rows = data.get("rows", [])
        col_count = len(header) if header else (len(rows[0]) if rows else 0)
        norm_rows = []
        for r in rows:
            r = list(r)
            if len(r) < col_count:
                r += [""] * (col_count - len(r))
            norm_rows.append(r)

        ths = []
        for c in range(col_count):
            value = header[c] if c < len(header) else ""
            display = value if str(value).strip() else "&nbsp;"
            ths.append(f"<th><a href=\"cell:{table_idx}:0:{c}\" class=\"cell-link\">{display}</a></th>")
        thead = "<tr>" + "".join(ths) + "</tr>"

        body_rows = []
        for r_idx, row in enumerate(norm_rows, start=1):
            tds = []
            for c in range(col_count):
                value = row[c] if c < len(row) else ""
                display = value if str(value).strip() else "&nbsp;"
                tds.append(f"<td><a href=\"cell:{table_idx}:{r_idx}:{c}\" class=\"cell-link\">{display}</a></td>")
            body_rows.append("<tr>" + "".join(tds) + "</tr>")

        return f"<table data-embedded=\"1\">{thead}{''.join(body_rows)}</table>"

    def handle_slash_command(self, cmd_id: str):
        cursor = self.edit.textCursor()

        start_pos = cursor.position()
        block_text = cursor.block().text()
        block_pos = cursor.positionInBlock()

        slash_pos = -1
        for i in range(block_pos - 1, -1, -1):
            if block_text[i] == "/":
                slash_pos = i
                break

        if slash_pos >= 0:
            cursor.setPosition(cursor.block().position() + slash_pos)
            cursor.setPosition(start_pos, QTextCursor.MoveMode.KeepAnchor)
            cursor.removeSelectedText()

        if cmd_id == "text":
            pass
        elif cmd_id == "h1":
            cursor.insertText("# ")
        elif cmd_id == "h2":
            cursor.insertText("## ")
        elif cmd_id == "h3":
            cursor.insertText("### ")
        elif cmd_id == "table":
            self.insert_table_widget()
        elif cmd_id == "code":
            cursor.insertText("```\n\n```")
            cursor.movePosition(QTextCursor.MoveOperation.Up)
            self.edit.setTextCursor(cursor)
        elif cmd_id == "list":
            cursor.insertText("- ")
        elif cmd_id == "check":
            cursor.insertText("- [ ] ")
        elif cmd_id == "quote":
            cursor.insertText("> ")

        self.slash_menu.hide()
        self.update_preview()
        self.content_changed.emit()

    def insert_table_widget(self):
        if not hasattr(self, "table_widget"):
            from ..widgets.table_insert import TableInsertWidget

            self.table_widget = TableInsertWidget(self)
            self.table_widget.table_selected.connect(self.insert_table)

        cursor_rect = self.edit.cursorRect()
        cursor_pos = self.edit.mapToGlobal(cursor_rect.bottomLeft())
        self.table_widget.show_at_cursor(cursor_pos)

    def insert_table(self, rows: int, cols: int):
        cursor = self.edit.textCursor()
        cursor.movePosition(QTextCursor.MoveOperation.StartOfLine)
        if cursor.positionInBlock() > 0:
            cursor.movePosition(QTextCursor.MoveOperation.EndOfLine)
            cursor.insertText("\n")
        header_cells = [f"Col {i+1}" for i in range(cols)]
        rows_data = [["" for _ in range(cols)] for _ in range(rows)]
        table_id = uuid.uuid4().hex
        data = {"id": table_id, "header": header_cells, "rows": rows_data}
        self.tables[table_id] = data
        marker = self._build_table_marker(table_id)
        cursor.insertText(marker + "\n")
        self.edit.setTextCursor(cursor)
        self.update_preview()
        self.content_changed.emit()

    def get_data(self):
        text = self._normalize_tables_in_text()
        segments = self._build_segments_from_text(text)
        return {"type": "text", "content": {"segments": segments}}

    def set_data(self, data):
        content = data.get("content", "") if isinstance(data, dict) else data
        self.tables = {}
        if isinstance(content, dict) and "segments" in content:
            self._load_from_segments(content.get("segments", []))
        else:
            self.edit.setPlainText(content if isinstance(content, str) else "")
            self._normalize_tables_in_text()

        self._refresh_embedded_spans()

        if self.edit.toPlainText().strip():
            self.update_preview()
            self.preview.show()
            self.edit.hide()
        else:
            self.preview.hide()
            self.edit.show()

    def set_interactive(self, active: bool):
        self.preview_interactive = bool(active)
        if not active and hasattr(self, "cell_editor"):
            try:
                self.cell_editor.hide()
            except Exception:
                pass

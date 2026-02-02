from __future__ import annotations

import html
import uuid

from PyQt6.QtCore import Qt, QEvent
from PyQt6.QtWidgets import QTableWidget, QTableWidgetItem, QTextBrowser, QSizePolicy

from .base import BaseBlock, ClickablePreview
from .config_loader import load_block_defaults


class TableBlock(BaseBlock):
    def __init__(self, content=None, theme_manager=None):
        super().__init__()
        defaults = load_block_defaults().get("TableBlock", {})
        self.theme_manager = theme_manager
        self.table_data = {"id": uuid.uuid4().hex, "header": [], "rows": []}

        self.table_edit = QTableWidget()
        self.table_edit.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        self.table_edit.setMinimumHeight(120)
        self.table_edit.installEventFilter(self)
        self.table_edit.cellChanged.connect(self.content_changed.emit)

        self.preview = ClickablePreview()
        self.preview.setOpenExternalLinks(False)
        self.preview.setOpenLinks(False)
        self.preview.setFrameShape(QTextBrowser.Shape.NoFrame)
        self.preview.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)

        self.layout.addWidget(self.preview)
        self.layout.addWidget(self.table_edit)

        if content:
            self.set_data({"content": content} if isinstance(content, dict) else content)
        else:
            min_cols = int(defaults.get("min_columns", "1"))
            self.table_edit.setColumnCount(max(1, min_cols))
            self.table_edit.setRowCount(1)
            self.preview.hide()
            self.table_edit.show()

    def eventFilter(self, obj, event):
        if obj is self.table_edit:
            if event.type() == QEvent.Type.FocusIn:
                self.got_focus.emit(self)
            if event.type() == QEvent.Type.KeyPress:
                if event.key() == Qt.Key.Key_Backspace:
                    row = self.table_edit.currentRow()
                    col = self.table_edit.currentColumn()
                    item = self.table_edit.item(row, col)
                    if row == 0 and col == 0 and (item is None or item.text() == ""):
                        self.delete_requested.emit(self)
                        return True
        return super().eventFilter(obj, event)

    def show_preview(self):
        self.table_edit.hide()
        self.preview.show()

    def update_preview(self):
        header = self.table_data.get("header", [])
        rows = self.table_data.get("rows", [])
        html_rows = []
        head_cells = "".join(f"<th>{html.escape(str(c))}</th>" for c in header)
        html_rows.append(f"<tr>{head_cells}</tr>")
        for r in rows:
            cells = "".join(f"<td>{html.escape(str(c))}</td>" for c in r)
            html_rows.append(f"<tr>{cells}</tr>")
        html_body = f"<table>{''.join(html_rows)}</table>"
        self.preview.setHtml(html_body)
        try:
            width = self.preview.viewport().width() or self.preview.width() or 400
            self.preview.document().setTextWidth(max(100, width - 10))
        except Exception:
            pass
        doc_height = self.preview.document().size().height()
        self.preview.setFixedHeight(int(doc_height) + 15)

    def set_data(self, data):
        content = data.get("content", {}) if isinstance(data, dict) else {}
        self.table_data = {
            "id": content.get("id") or uuid.uuid4().hex,
            "header": content.get("header", []),
            "rows": content.get("rows", []),
        }
        header = self.table_data.get("header", [])
        rows = self.table_data.get("rows", [])
        cols = max(len(header), max((len(r) for r in rows), default=0))
        cols = max(cols, 1)
        self.table_edit.blockSignals(True)
        self.table_edit.setColumnCount(cols)
        self.table_edit.setRowCount(len(rows))
        if header:
            self.table_edit.setHorizontalHeaderLabels([str(h) for h in header] + ["" for _ in range(cols - len(header))])
        for r_idx, row in enumerate(rows):
            for c_idx, val in enumerate(row):
                item = QTableWidgetItem(str(val))
                self.table_edit.setItem(r_idx, c_idx, item)
        self.table_edit.blockSignals(False)
        self.update_preview()

    def get_data(self):
        header = []
        for c in range(self.table_edit.columnCount()):
            h_item = self.table_edit.horizontalHeaderItem(c)
            header.append(h_item.text() if h_item else f"Col {c+1}")
        rows = []
        for r in range(self.table_edit.rowCount()):
            row_vals = []
            for c in range(self.table_edit.columnCount()):
                item = self.table_edit.item(r, c)
                row_vals.append(item.text() if item else "")
            rows.append(row_vals)
        self.table_data["header"] = header
        self.table_data["rows"] = rows
        return {"type": "table", "content": self.table_data}

    def apply_theme(self):
        self.update_preview()

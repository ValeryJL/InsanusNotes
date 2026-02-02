from __future__ import annotations

from PyQt6.QtGui import QColor, QTextCharFormat, QSyntaxHighlighter


class EmbeddedTableHighlighter(QSyntaxHighlighter):
    """Oculta visualmente los marcadores <!--table:{...}--> en el editor."""

    def __init__(self, document, theme_manager=None):
        super().__init__(document)
        self.theme_manager = theme_manager
        self.fg = QColor(0, 0, 0, 0)
        self.bg = QColor(0, 0, 0, 0)
        self.update_colors(theme_manager)

    def update_colors(self, theme_manager=None):
        if theme_manager:
            self.theme_manager = theme_manager
        if self.theme_manager:
            theme = self.theme_manager.get_current_theme()
            if theme and "colors" in theme:
                c = theme["colors"]
                try:
                    self.bg = QColor(c.get("background_primary", "#000000"))
                    self.bg.setAlpha(0)
                except Exception:
                    self.bg = QColor(0, 0, 0, 0)
                self.fg = QColor(0, 0, 0, 0)
        self.rehighlight()

    def highlightBlock(self, text):
        start_token = "<!--table:"
        end_token = "-->"
        fmt = QTextCharFormat()
        fmt.setForeground(self.fg)
        fmt.setBackground(self.bg)

        start = 0 if self.previousBlockState() == 1 else text.find(start_token)
        while start >= 0:
            end = text.find(end_token, start)
            if end == -1:
                self.setFormat(start, len(text) - start, fmt)
                self.setCurrentBlockState(1)
                return
            end_pos = end + len(end_token)
            self.setFormat(start, end_pos - start, fmt)
            start = text.find(start_token, end_pos)

        self.setCurrentBlockState(0)

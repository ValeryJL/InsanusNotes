from __future__ import annotations

from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QMouseEvent
from PyQt6.QtWidgets import QWidget, QVBoxLayout, QTextBrowser


class BaseBlock(QWidget):
    """Base común para todos los bloques del editor."""

    got_focus = pyqtSignal(object)
    content_changed = pyqtSignal()
    split_requested = pyqtSignal(object, str)
    delete_requested = pyqtSignal(object)

    def __init__(self):
        super().__init__()
        self.setAttribute(Qt.WidgetAttribute.WA_StyledBackground, True)
        self.layout = QVBoxLayout(self)
        self.layout.setContentsMargins(8, 4, 8, 4)
        self.layout.setSpacing(4)


class ClickablePreview(QTextBrowser):
    """QTextBrowser que emite señales de click/links internos."""

    clicked = pyqtSignal()
    link_clicked = pyqtSignal(str, object)

    def mousePressEvent(self, event: QMouseEvent):
        try:
            pos = event.position().toPoint()
        except Exception:
            pos = event.pos()
        href = self.anchorAt(pos)
        if href:
            self.link_clicked.emit(href, pos)
        else:
            self.clicked.emit()
        super().mousePressEvent(event)

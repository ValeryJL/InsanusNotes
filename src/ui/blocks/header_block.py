from __future__ import annotations

from PyQt6.QtCore import Qt, QEvent
from PyQt6.QtWidgets import QLineEdit, QSizePolicy

from .base import BaseBlock
from .config_loader import load_block_defaults


class HeaderBlock(BaseBlock):
    """Bloque de título principal de la nota/interfaz."""

    def __init__(self):
        super().__init__()
        defaults = load_block_defaults().get("HeaderBlock", {})
        placeholder = defaults.get("placeholder", "Título de la nota")

        self.edit = QLineEdit()
        self.edit.setObjectName("TitleBlock")
        self.edit.setPlaceholderText(placeholder)
        self.edit.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        self.edit.textChanged.connect(self.content_changed.emit)
        self.edit.installEventFilter(self)

        self.layout.addWidget(self.edit)

    def eventFilter(self, obj, event):
        if obj is self.edit and event.type() == QEvent.Type.FocusIn:
            self.got_focus.emit(self)
        return super().eventFilter(obj, event)

    def focus_in(self):
        self.edit.setFocus()

    def get_data(self) -> dict:
        return {"type": "header", "content": self.edit.text()}

    def set_data(self, data: dict):
        content = data.get("content", "") if isinstance(data, dict) else ""
        self.edit.setText(str(content))

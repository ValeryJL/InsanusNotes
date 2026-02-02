"""
Property value widgets and widget factory.

This module provides widgets for different property types and a factory
for creating them following the Factory design pattern.
"""

from __future__ import annotations

from typing import Any, List

from PyQt6.QtCore import pyqtSignal
from PyQt6.QtWidgets import (
    QWidget,
    QVBoxLayout,
    QHBoxLayout,
    QPushButton,
    QLineEdit,
    QComboBox,
    QCheckBox,
    QDoubleSpinBox,
    QLabel,
    QFrame,
    QSizePolicy,
)

from .property_models import PropertyRowData


class ArrayItemsWidget(QWidget):
    """
    Widget for managing array-type properties.
    
    Allows adding, editing, and removing items in an array property.
    Each item can have its own type (Text, Boolean, Number, List).
    
    Signals:
        content_changed: Emitted when any item is added, removed, or modified
    """

    content_changed = pyqtSignal()

    def __init__(self, item_types: List[str], list_placeholder: str):
        """
        Initialize the array items widget.
        
        Args:
            item_types: List of allowed types for array items
            list_placeholder: Placeholder text for list-type items
        """
        super().__init__()
        self.item_types = item_types
        self.list_placeholder = list_placeholder
        self.items: List[PropertyRowData] = []

        self.layout = QVBoxLayout(self)
        self.layout.setContentsMargins(16, 4, 4, 4)
        self.layout.setSpacing(4)

        add_btn = QPushButton("+ Agregar item")
        add_btn.setObjectName("PropAddButton")
        add_btn.clicked.connect(self._on_add_clicked)
        self.layout.addWidget(add_btn)

    def add_item(self, name: str = "", value: Any = "", item_type: str = "Texto"):
        """
        Add a new item to the array.
        
        Args:
            name: Name/label for the item
            value: Initial value
            item_type: Type of the item (Texto, Booleano, Número, Lista)
        """
        row_widget = QWidget()
        row_layout = QHBoxLayout(row_widget)
        row_layout.setContentsMargins(0, 0, 0, 0)
        row_layout.setSpacing(6)

        safe_name = "" if name is None else str(name)
        key_edit = QLineEdit(safe_name)
        key_edit.setObjectName("PropKey")
        key_edit.setPlaceholderText("Item")
        key_edit.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        key_edit.textChanged.connect(self.content_changed.emit)

        type_combo = QComboBox()
        type_combo.setObjectName("PropType")
        type_combo.addItems(self.item_types)
        if item_type in self.item_types:
            type_combo.setCurrentText(item_type)
        type_combo.currentTextChanged.connect(self.content_changed.emit)

        value_widget = PropertyWidgetFactory.create_widget(item_type, value, self.list_placeholder)
        self._connect_widget_signals(value_widget)

        del_btn = QPushButton("x")
        del_btn.setObjectName("PropDelButton")
        del_btn.clicked.connect(lambda: self._remove_item(row_widget))

        sep = QFrame()
        sep.setObjectName("ItemSeparator")
        sep.setFrameShape(QFrame.Shape.VLine)

        row_layout.addWidget(key_edit)
        row_layout.addWidget(sep)
        row_layout.addWidget(type_combo)
        row_layout.addWidget(value_widget)
        row_layout.addWidget(del_btn)

        row_data = PropertyRowData(key_edit, type_combo, value_widget, row_widget, row_layout, QVBoxLayout())
        type_combo.currentTextChanged.connect(lambda t, row=row_data: self._replace_value_widget(row, t))

        self.layout.addWidget(row_widget)
        self.items.append(row_data)
        self.content_changed.emit()

    def _on_add_clicked(self):
        """Handle add button click."""
        self.add_item()

    def _replace_value_widget(self, row_data: PropertyRowData, new_type: str):
        """
        Replace the value widget when type changes.
        
        Args:
            row_data: Row data containing widgets to update
            new_type: New property type
        """
        row_layout = row_data.header_layout
        old_widget = row_data.value_widget
        idx = row_layout.indexOf(old_widget)
        if idx == -1:
            return
            
        new_widget = PropertyWidgetFactory.create_widget(new_type, "", self.list_placeholder)
        row_layout.replaceWidget(old_widget, new_widget)
        old_widget.deleteLater()
        row_data.value_widget = new_widget
        
        self._connect_widget_signals(new_widget)
        self.content_changed.emit()

    def _connect_widget_signals(self, widget: QWidget):
        """Connect common widget signals to content_changed."""
        if hasattr(widget, "textChanged"):
            widget.textChanged.connect(self.content_changed.emit)
        if hasattr(widget, "stateChanged"):
            widget.stateChanged.connect(self.content_changed.emit)
        if hasattr(widget, "valueChanged"):
            widget.valueChanged.connect(self.content_changed.emit)
        if hasattr(widget, "currentTextChanged"):
            widget.currentTextChanged.connect(self.content_changed.emit)

    def _remove_item(self, row_widget: QWidget):
        """
        Remove an item from the array.
        
        Args:
            row_widget: Widget to remove
        """
        for idx, row in enumerate(list(self.items)):
            if row.row_widget is row_widget:
                self.items.pop(idx)
                break
        self.layout.removeWidget(row_widget)
        row_widget.deleteLater()
        self.content_changed.emit()

    def toggle_visibility(self, visible: bool):
        """Toggle visibility of the widget."""
        self.setVisible(visible)

    def get_data(self) -> list:
        """
        Get all array items as a list of dictionaries.
        
        Returns:
            List of dicts with 'name', 'value', and 'type' keys
        """
        data = []
        for row in self.items:
            name = row.key_edit.text().strip()
            p_type = row.type_combo.currentText() if row.type_combo else "Texto"
            val = PropertyWidgetFactory.extract_value(row.value_widget, p_type, self.list_placeholder)
            data.append({"name": name, "value": val, "type": p_type})
        return data


class PropertyWidgetFactory:
    """
    Factory for creating property value widgets.
    
    Uses the Factory design pattern to create appropriate widgets
    based on property type.
    """

    @staticmethod
    def create_widget(p_type: str, initial_value: Any, list_placeholder: str = "") -> QWidget:
        """
        Create a widget for the given property type.
        
        Args:
            p_type: Property type (Booleano, Número, Lista, Texto)
            initial_value: Initial value for the widget
            list_placeholder: Placeholder for list-type widgets
            
        Returns:
            Appropriate widget for the property type
        """
        if p_type == "Booleano":
            widget = QCheckBox()
            if initial_value is not None:
                widget.setChecked(bool(initial_value))
            return widget
            
        if p_type == "Número":
            widget = QDoubleSpinBox()
            widget.setRange(-999999, 999999)
            widget.setStyleSheet("background: transparent; border: none;")
            try:
                widget.setValue(float(initial_value))
            except Exception:
                pass
            return widget
            
        if p_type == "Lista":
            widget = QComboBox()
            widget.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
            widget.addItem(list_placeholder)
            if initial_value:
                widget.insertItem(0, str(initial_value))
                widget.setCurrentIndex(0)
            return widget
            
        # Default: Text widget
        widget = QLineEdit(str(initial_value) if initial_value is not None else "")
        widget.setObjectName("PropValue")
        widget.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        return widget

    @staticmethod
    def extract_value(widget: QWidget, p_type: str, list_placeholder: str = "") -> Any:
        """
        Extract value from a property widget.
        
        Args:
            widget: Widget to extract value from
            p_type: Property type
            list_placeholder: Placeholder for list-type widgets
            
        Returns:
            Extracted value in appropriate type
        """
        if p_type == "Booleano":
            return widget.isChecked() if hasattr(widget, "isChecked") else False
            
        if p_type == "Número":
            return widget.value() if hasattr(widget, "value") else 0
            
        if p_type == "Lista":
            val = widget.currentText() if hasattr(widget, "currentText") else ""
            return "" if val == list_placeholder else val
            
        # Default: Text
        return widget.text() if hasattr(widget, "text") else ""

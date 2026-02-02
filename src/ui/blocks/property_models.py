"""
Data models for property blocks.

This module contains data structures used by the properties block system.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from PyQt6.QtWidgets import QWidget, QVBoxLayout, QHBoxLayout, QLineEdit, QComboBox


@dataclass
class PropertyRowData:
    """
    Data structure representing a single property row in the UI.
    
    Attributes:
        key_edit: Widget for editing the property name
        type_combo: Widget for selecting property type (None for "Implementa")
        value_widget: Widget for editing the property value
        row_widget: Container widget for the entire row
        header_layout: Layout for the main row content
        complex_layout: Layout for complex nested widgets (like arrays)
        inherited: Whether this property is inherited from a parent
    """
    key_edit: QLineEdit
    type_combo: Optional[QComboBox]
    value_widget: QWidget
    row_widget: QWidget
    header_layout: QHBoxLayout
    complex_layout: QVBoxLayout
    inherited: bool = False

"""
Conflict resolution dialog for property inheritance.

Provides UI for resolving conflicts between local and parent properties.
"""

from __future__ import annotations

from typing import Dict, List

from PyQt6.QtWidgets import (
    QDialog,
    QVBoxLayout,
    QHBoxLayout,
    QLabel,
    QPushButton,
    QFrame,
    QScrollArea,
    QWidget,
    QSizePolicy,
)
from PyQt6.QtCore import Qt


class ConflictResolutionDialog(QDialog):
    """
    Dialog for resolving property inheritance conflicts.
    
    Shows side-by-side comparison of local and parent properties,
    allowing user to choose "Keep Local" or "Overwrite" for each.
    """
    
    def __init__(self, conflicts: List[Dict], parent=None):
        """
        Initialize the conflict resolution dialog.
        
        Args:
            conflicts: List of conflict dicts with 'name', 'local_type', 'local_value',
                      'parent_type', 'parent_value'
            parent: Parent widget
        """
        super().__init__(parent)
        self.conflicts = conflicts
        self.resolutions = {}  # name -> "keep" or "overwrite"
        
        self.setWindowTitle("Resolver Conflictos de Herencia")
        self.setMinimumWidth(600)
        self.setMinimumHeight(400)
        
        self._build_ui()
    
    def _build_ui(self):
        """Build the dialog UI."""
        layout = QVBoxLayout(self)
        
        # Header
        header = QLabel("Las siguientes propiedades están en conflicto con el padre.\n"
                       "Selecciona qué hacer con cada una:")
        header.setWordWrap(True)
        layout.addWidget(header)
        
        # Scroll area for conflicts
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        
        scroll_content = QWidget()
        scroll_layout = QVBoxLayout(scroll_content)
        scroll_layout.setSpacing(10)
        
        # Create a row for each conflict
        for conflict in self.conflicts:
            conflict_widget = self._create_conflict_row(conflict)
            scroll_layout.addWidget(conflict_widget)
        
        scroll_layout.addStretch()
        scroll.setWidget(scroll_content)
        layout.addWidget(scroll)
        
        # Buttons
        button_layout = QHBoxLayout()
        button_layout.addStretch()
        
        btn_cancel = QPushButton("Cancelar Herencia")
        btn_cancel.clicked.connect(self.reject)
        button_layout.addWidget(btn_cancel)
        
        btn_apply = QPushButton("Aplicar Resoluciones")
        btn_apply.clicked.connect(self.accept)
        btn_apply.setDefault(True)
        button_layout.addWidget(btn_apply)
        
        layout.addLayout(button_layout)
    
    def _create_conflict_row(self, conflict: Dict) -> QWidget:
        """Create a widget row for a single conflict."""
        widget = QFrame()
        widget.setFrameShape(QFrame.Shape.StyledPanel)
        widget.setObjectName("ConflictRow")
        
        layout = QVBoxLayout(widget)
        
        # Property name header
        name_label = QLabel(f"<b>Propiedad: {conflict['name']}</b>")
        layout.addWidget(name_label)
        
        # Comparison layout
        comp_layout = QHBoxLayout()
        
        # Local property
        local_widget = QFrame()
        local_widget.setFrameShape(QFrame.Shape.Box)
        local_layout = QVBoxLayout(local_widget)
        local_layout.addWidget(QLabel("<b>Local (Actual)</b>"))
        local_layout.addWidget(QLabel(f"Tipo: {conflict['local_type']}"))
        value_text = str(conflict.get('local_value', ''))
        if len(value_text) > 50:
            value_text = value_text[:47] + "..."
        local_layout.addWidget(QLabel(f"Valor: {value_text}"))
        comp_layout.addWidget(local_widget)
        
        # Parent property
        parent_widget = QFrame()
        parent_widget.setFrameShape(QFrame.Shape.Box)
        parent_layout = QVBoxLayout(parent_widget)
        parent_layout.addWidget(QLabel("<b>Padre (Heredado)</b>"))
        parent_layout.addWidget(QLabel(f"Tipo: {conflict['parent_type']}"))
        parent_value_text = str(conflict.get('parent_value', ''))
        if len(parent_value_text) > 50:
            parent_value_text = parent_value_text[:47] + "..."
        parent_layout.addWidget(QLabel(f"Valor: {parent_value_text}"))
        comp_layout.addWidget(parent_widget)
        
        layout.addLayout(comp_layout)
        
        # Action buttons
        action_layout = QHBoxLayout()
        action_layout.addStretch()
        
        btn_keep = QPushButton("Mantener Local")
        btn_keep.clicked.connect(lambda: self._set_resolution(conflict['name'], "keep", btn_keep, btn_overwrite))
        action_layout.addWidget(btn_keep)
        
        btn_overwrite = QPushButton("Sobreescribir con Padre")
        btn_overwrite.clicked.connect(lambda: self._set_resolution(conflict['name'], "overwrite", btn_overwrite, btn_keep))
        action_layout.addWidget(btn_overwrite)
        
        layout.addLayout(action_layout)
        
        # Store button references
        widget.keep_btn = btn_keep
        widget.overwrite_btn = btn_overwrite
        
        # Set default to "keep"
        self._set_resolution(conflict['name'], "keep", btn_keep, btn_overwrite)
        
        return widget
    
    def _set_resolution(self, name: str, resolution: str, selected_btn: QPushButton, other_btn: QPushButton):
        """Set the resolution for a property and update button styles."""
        self.resolutions[name] = resolution
        
        # Update button styles
        selected_btn.setStyleSheet("background-color: #0066cc; color: white; font-weight: bold;")
        other_btn.setStyleSheet("")
    
    def get_resolutions(self) -> Dict[str, str]:
        """Get all conflict resolutions."""
        return self.resolutions


class SimpleConflictDialog(QDialog):
    """
    Simple dialog for basic conflict handling.
    
    Shows conflicts and offers: Cancel, Delete Conflicts, or Handle Conflicts.
    """
    
    def __init__(self, conflicts: List[str], parent=None, allow_cancel: bool = True):
        """
        Initialize the simple conflict dialog.
        
        Args:
            conflicts: List of conflicting property names
            parent: Parent widget
            allow_cancel: Whether to show cancel button
        """
        super().__init__(parent)
        self.conflicts = conflicts
        self.result_action = None  # "cancel", "delete", or "handle"
        
        self.setWindowTitle("Conflictos de Herencia")
        self.setMinimumWidth(400)
        
        self._build_ui(allow_cancel)
    
    def _build_ui(self, allow_cancel: bool):
        """Build the dialog UI."""
        layout = QVBoxLayout(self)
        
        # Message
        msg = QLabel(f"Las siguientes propiedades están en conflicto:\n\n"
                    + "\n".join(f"• {name}" for name in self.conflicts))
        msg.setWordWrap(True)
        layout.addWidget(msg)
        
        # Buttons
        button_layout = QHBoxLayout()
        button_layout.addStretch()
        
        if allow_cancel:
            btn_cancel = QPushButton("Cancelar")
            btn_cancel.clicked.connect(lambda: self._set_action("cancel"))
            button_layout.addWidget(btn_cancel)
        
        btn_delete = QPushButton("Eliminar Propiedades en Conflicto")
        btn_delete.clicked.connect(lambda: self._set_action("delete"))
        button_layout.addWidget(btn_delete)
        
        btn_handle = QPushButton("Manejar Conflictos")
        btn_handle.clicked.connect(lambda: self._set_action("handle"))
        btn_handle.setDefault(True)
        button_layout.addWidget(btn_handle)
        
        layout.addLayout(button_layout)
    
    def _set_action(self, action: str):
        """Set the action and close dialog."""
        self.result_action = action
        self.accept()
    
    def get_action(self) -> str:
        """Get the selected action."""
        return self.result_action

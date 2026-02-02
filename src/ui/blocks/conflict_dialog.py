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
    QLineEdit,
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


class TypeConflictResolutionDialog(QDialog):
    """
    Dialog for resolving type conflicts (same name, different type).
    
    Offers three options: Overwrite (adopt parent type), Rename (change local name), Delete.
    """
    
    def __init__(self, conflicts: List[Dict], parent=None):
        """
        Initialize the type conflict resolution dialog.
        
        Args:
            conflicts: List of conflict dicts with 'name', 'local_type', 'local_value',
                      'parent_type', 'parent_value'
            parent: Parent widget
        """
        super().__init__(parent)
        self.conflicts = conflicts
        self.resolutions = {}  # name -> {"action": "overwrite"/"rename"/"delete", "new_name": str}
        
        self.setWindowTitle("Resolver Conflictos de Tipo")
        self.setMinimumWidth(700)
        self.setMinimumHeight(450)
        
        self._build_ui()
    
    def _build_ui(self):
        """Build the dialog UI."""
        layout = QVBoxLayout(self)
        
        # Header
        header = QLabel("Las siguientes propiedades tienen el mismo nombre pero diferente tipo.\n"
                       "Selecciona qué hacer con cada una:")
        header.setWordWrap(True)
        layout.addWidget(header)
        
        # Scroll area for conflicts
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        
        scroll_content = QWidget()
        scroll_layout = QVBoxLayout(scroll_content)
        scroll_layout.setSpacing(15)
        
        # Create a row for each conflict
        for conflict in self.conflicts:
            conflict_widget = self._create_type_conflict_row(conflict)
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
        btn_apply.clicked.connect(self._apply_resolutions)
        btn_apply.setDefault(True)
        button_layout.addWidget(btn_apply)
        
        layout.addLayout(button_layout)
    
    def _create_type_conflict_row(self, conflict: Dict) -> QWidget:
        """Create a widget row for a single type conflict."""
        widget = QFrame()
        widget.setFrameShape(QFrame.Shape.StyledPanel)
        widget.setObjectName("TypeConflictRow")
        
        layout = QVBoxLayout(widget)
        
        # Property name header
        name_label = QLabel(f"<b>Propiedad: {conflict['name']}</b>")
        layout.addWidget(name_label)
        
        # Type conflict notice
        type_notice = QLabel(f"⚠️ Conflicto de tipo: Local es '{conflict['local_type']}', "
                            f"Padre es '{conflict['parent_type']}'")
        type_notice.setStyleSheet("color: #ff8800;")
        layout.addWidget(type_notice)
        
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
        action_layout = QVBoxLayout()
        
        # Overwrite option
        overwrite_layout = QHBoxLayout()
        btn_overwrite = QPushButton("Sobreescribir (adoptar tipo del padre)")
        btn_overwrite.clicked.connect(lambda: self._set_type_resolution(
            conflict['name'], "overwrite", widget, btn_overwrite, btn_rename, btn_delete))
        overwrite_layout.addWidget(btn_overwrite)
        action_layout.addLayout(overwrite_layout)
        
        # Rename option
        rename_layout = QHBoxLayout()
        btn_rename = QPushButton("Renombrar local")
        rename_input = QLineEdit()
        rename_input.setPlaceholderText(f"Nuevo nombre (ej: {conflict['name']}_local)")
        rename_input.setText(f"{conflict['name']}_local")
        rename_input.setEnabled(False)
        btn_rename.clicked.connect(lambda: self._set_type_resolution(
            conflict['name'], "rename", widget, btn_rename, btn_overwrite, btn_delete, rename_input))
        rename_layout.addWidget(btn_rename)
        rename_layout.addWidget(rename_input)
        action_layout.addLayout(rename_layout)
        
        # Delete option
        delete_layout = QHBoxLayout()
        btn_delete = QPushButton("Eliminar propiedad local")
        btn_delete.clicked.connect(lambda: self._set_type_resolution(
            conflict['name'], "delete", widget, btn_delete, btn_rename, btn_overwrite))
        delete_layout.addWidget(btn_delete)
        action_layout.addLayout(delete_layout)
        
        layout.addLayout(action_layout)
        
        # Store widget references
        widget.overwrite_btn = btn_overwrite
        widget.rename_btn = btn_rename
        widget.delete_btn = btn_delete
        widget.rename_input = rename_input
        
        # Set default to "delete"
        self._set_type_resolution(conflict['name'], "delete", widget, btn_delete, btn_rename, btn_overwrite)
        
        return widget
    
    def _set_type_resolution(self, name: str, action: str, widget: QWidget, 
                            selected_btn: QPushButton, *other_btns, rename_input=None):
        """Set the resolution for a type conflict and update button styles."""
        self.resolutions[name] = {"action": action}
        
        # Update button styles
        selected_btn.setStyleSheet("background-color: #0066cc; color: white; font-weight: bold;")
        for btn in other_btns:
            if btn:
                btn.setStyleSheet("")
        
        # Handle rename input
        if hasattr(widget, 'rename_input'):
            if action == "rename" and rename_input:
                widget.rename_input.setEnabled(True)
                widget.rename_input.setFocus()
            else:
                widget.rename_input.setEnabled(False)
    
    def _apply_resolutions(self):
        """Validate and apply resolutions."""
        # Validate rename actions have valid new names
        for name, resolution in self.resolutions.items():
            if resolution["action"] == "rename":
                # Find the rename input for this conflict
                for i in range(self.layout().itemAt(1).widget().widget().layout().count()):
                    item = self.layout().itemAt(1).widget().widget().layout().itemAt(i)
                    if item and item.widget():
                        conflict_widget = item.widget()
                        if hasattr(conflict_widget, 'rename_input'):
                            # Check if this is the right conflict
                            for child in conflict_widget.findChildren(QLabel):
                                if name in child.text():
                                    new_name = conflict_widget.rename_input.text().strip()
                                    if not new_name:
                                        from PyQt6.QtWidgets import QMessageBox
                                        QMessageBox.warning(self, "Nombre vacío", 
                                            f"Debes proporcionar un nuevo nombre para '{name}'")
                                        return
                                    resolution["new_name"] = new_name
                                    break
        
        self.accept()
    
    def get_resolutions(self) -> Dict[str, Dict]:
        """Get all type conflict resolutions."""
        return self.resolutions

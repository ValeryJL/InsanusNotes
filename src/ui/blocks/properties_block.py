"""
Properties block component - Refactored version.

This module contains the main PropertiesBlock component, now simplified
by extracting widget creation, inheritance logic, and data models to
separate modules following SOLID principles.
"""

from __future__ import annotations

from typing import Any, List, Optional

from PyQt6.QtCore import Qt, QEvent
from PyQt6.QtWidgets import (
    QWidget,
    QVBoxLayout,
    QHBoxLayout,
    QPushButton,
    QLineEdit,
    QComboBox,
    QFrame,
    QSizePolicy,
    QInputDialog,
)

from .base import BaseBlock
from .config_loader import load_block_defaults, load_property_types
from .property_models import PropertyRowData
from .property_widgets import ArrayItemsWidget, PropertyWidgetFactory
from .property_inheritance import PropertyInheritanceManager


class PropertiesBlock(BaseBlock):
    """
    Block for managing properties with inheritance support.
    
    Supports various property types (Text, Boolean, Number, List, Array)
    and allows inheritance from interface files using the "Implementa" property.
    
    Refactored to follow Single Responsibility Principle by delegating:
    - Widget creation to PropertyWidgetFactory
    - Inheritance logic to PropertyInheritanceManager
    - Data models to property_models module
    """

    def __init__(self, interface_mode: bool = False, project_path: Optional[str] = None, is_interface: bool = False):
        """
        Initialize the properties block.
        
        Args:
            interface_mode: Whether this is used in an interface context
            project_path: Path to the project root
            is_interface: Whether we're editing an interface file
        """
        super().__init__()
        
        # Load configuration
        defaults = load_block_defaults().get("PropertiesBlock", {})
        self.panel_title = defaults.get("panel_title", "PROPIEDADES")

        # Initialize state
        self.interface_mode = interface_mode
        self.project_path = project_path
        self.is_interface = is_interface
        self.rows: List[PropertyRowData] = []
        self.inherited_properties: List[PropertyRowData] = []
        self.has_inheritance_errors = False
        self._loading_data = False
        self._loading_inherited = False

        # Load property types configuration
        cfg = load_property_types()
        self.property_types = cfg.get("types", ["Texto", "Booleano", "Número", "Lista", "Arreglo"])
        self.list_placeholder = cfg.get("list_placeholder", "+ Agregar opción...")
        self.array_item_types = cfg.get("array_item_types", ["Texto", "Booleano", "Número", "Lista"])

        # Initialize inheritance manager
        self.inheritance_manager = PropertyInheritanceManager(project_path, is_interface)

        # Build UI
        self._build_ui()
        
        # Add default "Implementa" property
        self.add_prop_row("Implementa", "")

    def _build_ui(self):
        """Build the properties panel UI."""
        self.panel = QWidget()
        self.panel.setObjectName("PropertiesPanel")
        panel_layout = QVBoxLayout(self.panel)
        panel_layout.setContentsMargins(0, 0, 0, 0)
        panel_layout.setSpacing(4)

        self.btn_toggle = QPushButton(self.panel_title)
        self.btn_toggle.setObjectName("PropToggleButton")
        self.btn_toggle.clicked.connect(self._toggle_panel)

        self.props_container = QWidget()
        self.props_layout = QVBoxLayout(self.props_container)
        self.props_layout.setContentsMargins(0, 0, 0, 0)
        self.props_layout.setSpacing(6)

        self.btn_add = QPushButton("+ Agregar propiedad")
        self.btn_add.setObjectName("PropAddButton")
        self.btn_add.clicked.connect(self.add_prop_row)

        panel_layout.addWidget(self.btn_toggle)
        panel_layout.addWidget(self.props_container)
        panel_layout.addWidget(self.btn_add)

        self.layout.addWidget(self.panel)

    def _toggle_panel(self):
        """Toggle visibility of properties panel."""
        visible = not self.props_container.isVisible()
        self.props_container.setVisible(visible)
        self.btn_add.setVisible(visible)

    def show_panel(self):
        """Show the properties panel."""
        self.props_container.setVisible(True)
        self.btn_add.setVisible(True)

    def hide_panel(self):
        """Hide the properties panel."""
        self.props_container.setVisible(False)
        self.btn_add.setVisible(False)

    def add_prop_row(self, key: str = "", initial_value: Any = "", p_type: str = "Texto"):
        """
        Add a new property row.
        
        Args:
            key: Property name
            initial_value: Initial value
            p_type: Property type
        """
        row_widget = QWidget()
        row_layout = QVBoxLayout(row_widget)
        row_layout.setContentsMargins(0, 0, 0, 0)
        row_layout.setSpacing(4)

        header_layout = QHBoxLayout()
        header_layout.setContentsMargins(0, 0, 0, 0)
        header_layout.setSpacing(6)

        # Create key input
        safe_key = "" if key is None else str(key)
        key_edit = QLineEdit(safe_key)
        key_edit.setObjectName("PropKey")
        key_edit.setPlaceholderText("Nombre")
        key_edit.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        key_edit.textChanged.connect(lambda text: self._validate_property_name(key_edit, text))
        key_edit.textChanged.connect(self.content_changed.emit)
        key_edit.installEventFilter(self)

        type_combo = None
        value_widget: QWidget

        # Handle "Implementa" property specially
        if key == "Implementa":
            value_widget = self._create_implements_widget(initial_value)
        else:
            type_combo, value_widget = self._create_property_widgets(p_type, initial_value)

        # Create delete button
        del_btn = QPushButton("x")
        del_btn.setObjectName("PropDelButton")

        # Create separator
        sep = QFrame()
        sep.setObjectName("ItemSeparator")
        sep.setFrameShape(QFrame.Shape.VLine)

        # Build header layout
        header_layout.addWidget(key_edit)
        header_layout.addWidget(sep)
        if type_combo:
            header_layout.addWidget(type_combo)
        header_layout.addWidget(value_widget)
        header_layout.addWidget(del_btn)

        # Create complex layout for nested widgets
        complex_layout = QVBoxLayout()
        complex_layout.setContentsMargins(0, 0, 0, 0)

        # Build row layout
        row_layout.addLayout(header_layout)
        row_layout.addLayout(complex_layout)

        # Create row data
        row_data = PropertyRowData(key_edit, type_combo, value_widget, row_widget, header_layout, complex_layout)
        
        # Connect signals
        del_btn.clicked.connect(lambda: self.remove_prop_row(row_data))
        
        if type_combo:
            type_combo.currentTextChanged.connect(lambda t, row=row_data: self._on_type_changed(row, t))

        # Add to layout and list
        self.props_layout.addWidget(row_widget)
        self.rows.append(row_data)
        self.content_changed.emit()

    def _create_implements_widget(self, initial_value: Any) -> QLineEdit:
        """Create widget for the Implementa property."""
        value_widget = QLineEdit(str(initial_value) if initial_value else "")
        value_widget.setObjectName("PropValue")
        value_widget.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        
        completer = self._create_file_completer()
        if completer:
            value_widget.setCompleter(completer)
            
        value_widget.textChanged.connect(lambda: self._on_implements_changed(value_widget))
        value_widget.installEventFilter(self)
        
        return value_widget

    def _create_property_widgets(self, p_type: str, initial_value: Any):
        """Create type combo and value widget for a regular property."""
        type_combo = QComboBox()
        type_combo.setObjectName("PropType")
        type_combo.addItems(self.property_types)
        if p_type in self.property_types:
            type_combo.setCurrentText(p_type)
            
        value_widget = self._build_value_widget(p_type, initial_value)
        value_widget.installEventFilter(self)
        
        return type_combo, value_widget

    def _build_value_widget(self, p_type: str, initial_value: Any) -> QWidget:
        """
        Build a value widget for the given property type.
        
        Delegates to PropertyWidgetFactory for simple types,
        creates ArrayItemsWidget for array types.
        """
        if p_type == "Arreglo":
            array_widget = ArrayItemsWidget(self.array_item_types, self.list_placeholder)
            array_widget.content_changed.connect(self.content_changed.emit)
            if isinstance(initial_value, list):
                for item in initial_value:
                    if isinstance(item, dict):
                        array_widget.add_item(
                            item.get("name", ""),
                            item.get("value", ""),
                            item.get("type", "Texto")
                        )
            return array_widget
        else:
            return PropertyWidgetFactory.create_widget(p_type, initial_value, self.list_placeholder)

    def _on_type_changed(self, row_data: PropertyRowData, new_type: str):
        """Handle property type change."""
        row_layout = row_data.header_layout
        old_widget = row_data.value_widget
        
        # Find the old widget position
        idx = row_layout.indexOf(old_widget)
        if idx == -1:
            return

        # Handle transition to/from array type
        if new_type == "Arreglo":
            # Remove old widget from header, add array to complex layout
            row_layout.removeWidget(old_widget)
            old_widget.deleteLater()
            
            array_widget = ArrayItemsWidget(self.array_item_types, self.list_placeholder)
            array_widget.content_changed.connect(self.content_changed.emit)
            row_data.complex_layout.addWidget(array_widget)
            row_data.value_widget = array_widget
            
        elif isinstance(old_widget, ArrayItemsWidget):
            # Moving from array to simple type
            row_data.complex_layout.removeWidget(old_widget)
            old_widget.deleteLater()
            
            new_widget = PropertyWidgetFactory.create_widget(new_type, "", self.list_placeholder)
            row_layout.insertWidget(idx, new_widget)
            new_widget.installEventFilter(self)
            row_data.value_widget = new_widget
            
        else:
            # Simple type to simple type
            new_widget = PropertyWidgetFactory.create_widget(new_type, "", self.list_placeholder)
            row_layout.replaceWidget(old_widget, new_widget)
            old_widget.deleteLater()
            new_widget.installEventFilter(self)
            row_data.value_widget = new_widget

        self.content_changed.emit()

    def remove_prop_row(self, row_data: PropertyRowData):
        """Remove a property row."""
        if row_data.key_edit.text() == "Implementa":
            return
            
        self.props_layout.removeWidget(row_data.row_widget)
        row_data.row_widget.deleteLater()
        
        if row_data in self.rows:
            self.rows.remove(row_data)
        if row_data in self.inherited_properties:
            self.inherited_properties.remove(row_data)
            
        self._revalidate_all_property_names()
        self.content_changed.emit()

    def get_plain_text(self) -> str:
        """Get plain text representation of properties."""
        lines = []
        for row in self.rows:
            name = row.key_edit.text().strip()
            if name:
                lines.append(f"{name}: ...")
        return "\n".join(lines)

    def to_dict(self) -> dict:
        """Serialize properties to dictionary."""
        content = {}
        for row in self.rows:
            name = row.key_edit.text().strip()
            if not name:
                continue
                
            p_type = row.type_combo.currentText() if row.type_combo else "Texto"
            
            if isinstance(row.value_widget, ArrayItemsWidget):
                value = row.value_widget.get_data()
            else:
                value = PropertyWidgetFactory.extract_value(row.value_widget, p_type, self.list_placeholder)

            if row.inherited:
                content[name] = {"type": p_type, "value": value, "inherit": True}
            else:
                content[name] = {"type": p_type, "value": value}

        return {"type": "properties", "content": content}

    def from_dict(self, data: dict):
        """Deserialize properties from dictionary."""
        self._loading_data = True
        
        # Clear existing rows except "Implementa"
        for row in list(self.rows):
            if row.key_edit.text() != "Implementa":
                self.remove_prop_row(row)

        content = data.get("content", {})
        
        # Load "Implementa" value
        impl_val = ""
        if "Implementa" in content:
            item = content["Implementa"]
            if isinstance(item, dict):
                impl_val = item.get("value", "")
            else:
                impl_val = str(item)
                
        # Update "Implementa" row
        for row in self.rows:
            if row.key_edit.text() == "Implementa":
                if hasattr(row.value_widget, "setText"):
                    row.value_widget.setText(impl_val)
                break
                
        # Get inherited property map
        parent_map = self.inheritance_manager.get_inherited_property_map(impl_val) if impl_val else {}

        # Load other properties
        for k, v in content.items():
            if k == "Implementa":
                continue
                
            p_type = "Texto"
            p_val = ""
            inherit_flag = False
            
            if isinstance(v, dict) and "type" in v:
                p_type = v.get("type", "Texto")
                p_val = v.get("value", "")
                inherit_flag = bool(v.get("inherit"))
            else:
                p_val = str(v)

            # Validate inheritance
            if inherit_flag and impl_val:
                parent_type = parent_map.get(k)
                if not parent_type or parent_type != p_type:
                    inherit_flag = False
                    
            self.add_prop_row(k, p_val, p_type)
            if inherit_flag and self.rows:
                self._mark_row_as_inherited(self.rows[-1])

        # Sync inherited properties
        if impl_val:
            self._sync_inherited_properties(impl_val)

        # Hide panel if empty and not interface
        if not self.is_interface and len(content) == 0:
            self.hide_panel()
            
        self._loading_data = False

    def eventFilter(self, obj, event):
        """Handle keyboard events for quick property addition."""
        if event.type() == QEvent.Type.KeyPress and event.key() == Qt.Key.Key_Return:
            for row_data in self.rows:
                if obj is row_data.value_widget and isinstance(row_data.value_widget, QLineEdit):
                    self.add_prop_row()
                    return True
        return super().eventFilter(obj, event)

    def _create_file_completer(self):
        """Create autocomplete for file paths."""
        from PyQt6.QtWidgets import QCompleter
        from PyQt6.QtCore import Qt as QtCore

        if not self.project_path:
            return None

        files = self.inheritance_manager.get_file_list()

        completer = QCompleter(files, self)
        completer.setCaseSensitivity(QtCore.CaseSensitivity.CaseInsensitive)
        completer.setCompletionMode(QCompleter.CompletionMode.UnfilteredPopupCompletion)
        completer.setFilterMode(QtCore.MatchFlag.MatchContains)
        completer.setMaxVisibleItems(10)
        
        try:
            completer.popup().setStyleSheet(
                """
                QListView {
                    background-color: #1e1e1e;
                    color: #e0e0e0;
                    border: 1px solid #444;
                    selection-background-color: #0066cc;
                }
                """
            )
        except Exception:
            pass

        return completer

    def _on_implements_changed(self, widget: QLineEdit):
        """Handle changes to the Implementa field."""
        if self._loading_data:
            return
            
        file_path = widget.text().strip()

        if not file_path:
            self._clear_inherited_properties()
            widget.setStyleSheet("")
            self.has_inheritance_errors = False
            return

        valid = self.inheritance_manager.validate_implements_file(file_path)
        if valid:
            duplicates = self._check_duplicate_properties(file_path)
            if duplicates:
                self._show_duplicate_warning(widget, file_path, duplicates)
            else:
                widget.setStyleSheet("")
                self.has_inheritance_errors = False
                self._sync_inherited_properties(file_path)
        else:
            widget.setStyleSheet("border: 1px solid #ff4444; background-color: #331111;")
            self.has_inheritance_errors = True
            self._clear_inherited_properties()

    def _show_duplicate_warning(self, widget: QLineEdit, file_path: str, duplicates: List[str]):
        """Show warning dialog for duplicate properties."""
        from PyQt6.QtWidgets import QMessageBox

        QMessageBox.warning(
            self,
            "Propiedades duplicadas",
            f"No se puede implementar '{file_path}' porque las siguientes propiedades ya existen:\n\n"
            + "\n".join(f"• {prop}" for prop in duplicates)
            + "\n\nElimina estas propiedades primero para poder implementar.",
        )
        widget.setStyleSheet("border: 1px solid #ff4444; background-color: #331111;")
        self.has_inheritance_errors = True
        self._clear_inherited_properties()
        
        for duplicate_name in duplicates:
            for row_data in self.rows:
                if row_data in self.inherited_properties:
                    continue
                if row_data.key_edit.text().strip() == duplicate_name:
                    row_data.key_edit.setStyleSheet("border: 1px solid #ff4444; background-color: #331111;")

    def _check_duplicate_properties(self, file_path: str) -> List[str]:
        """Check for duplicate properties between current and parent file."""
        parent_map = self.inheritance_manager.get_inherited_property_map(file_path)
        duplicates = []
        
        for row in self.rows:
            if row in self.inherited_properties:
                continue
            name = row.key_edit.text().strip()
            if name and name != "Implementa" and name in parent_map:
                duplicates.append(name)
                
        return duplicates

    def _validate_property_name(self, key_edit: QLineEdit, text: str):
        """Validate property name for duplicates."""
        if not text.strip() or text == "Implementa":
            key_edit.setStyleSheet("")
            return

        count = sum(1 for row in self.rows if row.key_edit.text().strip() == text.strip())
        if count > 1:
            key_edit.setStyleSheet("border: 1px solid #ff4444; background-color: #331111;")
        else:
            # Check against inherited
            has_dup = False
            for inherited_row in self.inherited_properties:
                if inherited_row.key_edit.text().strip() == text.strip():
                    has_dup = True
                    break
            if has_dup:
                key_edit.setStyleSheet("border: 1px solid #ff4444; background-color: #331111;")
            else:
                key_edit.setStyleSheet("")

    def _revalidate_all_property_names(self):
        """Revalidate all property names."""
        has_dup = False
        for row_data in self.rows:
            name = row_data.key_edit.text().strip()
            if not name or name == "Implementa":
                row_data.key_edit.setStyleSheet("")
                continue
                
            count = sum(1 for row in self.rows if row.key_edit.text().strip() == name)
            is_duplicate = count > 1
            
            if not is_duplicate:
                for inherited_row in self.inherited_properties:
                    if inherited_row.key_edit.text().strip() == name:
                        is_duplicate = True
                        break
                        
            if is_duplicate:
                row_data.key_edit.setStyleSheet("border: 1px solid #ff4444; background-color: #331111;")
                has_dup = True
            else:
                row_data.key_edit.setStyleSheet("")
                
        self.has_inheritance_errors = has_dup

    def _sync_inherited_properties(self, file_path: str):
        """Synchronize inherited properties from parent file."""
        parent_map = self.inheritance_manager.get_inherited_property_map(file_path)
        if not parent_map:
            return

        from PyQt6.QtWidgets import QMessageBox

        row_by_name = {row.key_edit.text().strip(): row for row in self.rows if row.key_edit.text().strip()}

        # Remove inherited properties that no longer exist in parent
        for row in list(self.inherited_properties):
            name = row.key_edit.text().strip()
            if name and name not in parent_map:
                msg = QMessageBox(self)
                msg.setWindowTitle("Herencia actualizada")
                msg.setText(
                    f"La propiedad heredada '{name}' ya no existe en el padre."
                    "\n¿Quieres conservarla como propia, eliminarla, o quitar Implementa?"
                )
                btn_keep = msg.addButton("Conservar propia", QMessageBox.ButtonRole.AcceptRole)
                btn_remove = msg.addButton("Eliminar propiedad", QMessageBox.ButtonRole.ActionRole)
                btn_remove_impl = msg.addButton("Quitar Implementa", QMessageBox.ButtonRole.DestructiveRole)
                msg.exec()
                
                if msg.clickedButton() == btn_remove_impl:
                    self._clear_implements()
                    return
                if msg.clickedButton() == btn_remove:
                    self.remove_prop_row(row)
                    continue
                self._unmark_row_as_inherited(row)

        # Add or reconcile properties from parent
        for name, p_type in parent_map.items():
            existing_row = row_by_name.get(name)
            if existing_row:
                same_type = True
                if existing_row.type_combo:
                    same_type = existing_row.type_combo.currentText() == p_type
                    
                if existing_row.inherited and same_type:
                    continue
                    
                if not same_type:
                    if not self._handle_type_conflict(name):
                        return
                    self.remove_prop_row(existing_row)
                else:
                    action = self._ask_inherit_existing(name)
                    if action == "remove_impl":
                        self._clear_implements()
                        return
                    if action == "inherit":
                        self._mark_row_as_inherited(existing_row)
                    continue

            # Property doesn't exist in child - add as inherited
            self._add_inherited_property(name, None if self.interface_mode else "", p_type)

    def _handle_type_conflict(self, name: str) -> bool:
        """Handle type conflict dialog. Returns False if should clear Implementa."""
        from PyQt6.QtWidgets import QMessageBox
        
        msg = QMessageBox(self)
        msg.setWindowTitle("Conflicto de herencia")
        msg.setText(
            f"La propiedad '{name}' existe con tipo distinto."
            "\n¿Quieres eliminar la propiedad actual o quitar Implementa?"
        )
        btn_remove = msg.addButton("Eliminar propiedad", QMessageBox.ButtonRole.AcceptRole)
        btn_remove_impl = msg.addButton("Quitar Implementa", QMessageBox.ButtonRole.DestructiveRole)
        msg.exec()
        
        if msg.clickedButton() == btn_remove_impl:
            self._clear_implements()
            return False
        return True

    def _ask_inherit_existing(self, name: str) -> str:
        """Ask user what to do with existing compatible property."""
        from PyQt6.QtWidgets import QMessageBox
        
        msg = QMessageBox(self)
        msg.setWindowTitle("Propiedad heredable")
        msg.setText(
            f"La propiedad '{name}' existe y es compatible con el padre."
            "\n¿Quieres marcarla como heredada, mantenerla propia, o quitar Implementa?"
        )
        btn_inherit = msg.addButton("Marcar heredada", QMessageBox.ButtonRole.AcceptRole)
        btn_keep = msg.addButton("Mantener propia", QMessageBox.ButtonRole.ActionRole)
        btn_remove_impl = msg.addButton("Quitar Implementa", QMessageBox.ButtonRole.DestructiveRole)
        msg.exec()
        
        if msg.clickedButton() == btn_remove_impl:
            return "remove_impl"
        if msg.clickedButton() == btn_inherit:
            return "inherit"
        return "keep"

    def _clear_implements(self):
        """Clear the Implementa field."""
        for row_data in self.rows:
            if row_data.key_edit.text() == "Implementa":
                if hasattr(row_data.value_widget, "setText"):
                    row_data.value_widget.setText("")
        self._clear_inherited_properties()

    def _load_inherited_properties(self, file_path: str):
        """Load inherited properties from a file (recursive)."""
        data = self.inheritance_manager.load_inherited_properties_data(file_path)
        
        if not hasattr(self, "_loading_inherited"):
            self._clear_inherited_properties()
            self._loading_inherited = True

        # Recursively load from parent
        if data.get("implements"):
            self._load_inherited_properties(data["implements"])

        # Load properties from this file
        from pathlib import Path
        full_path = Path(self.project_path) / file_path if self.project_path else None
        is_from_interface = full_path.suffix == ".inin" if full_path else False

        for prop in data.get("properties", []):
            if not isinstance(prop, dict):
                continue
                
            prop_name = prop.get("name", "")
            prop_type = prop.get("type", "Texto")
            if not prop_name:
                continue

            # Check if property already exists
            existing_row = None
            for row in self.rows:
                if row in self.inherited_properties:
                    continue
                if row.key_edit.text().strip() == prop_name:
                    existing_row = row
                    break

            if existing_row:
                same_type = True
                if existing_row.type_combo:
                    same_type = existing_row.type_combo.currentText() == prop_type
                    
                if existing_row.inherited and same_type:
                    continue
                    
                if not same_type:
                    if not self._handle_existing_different_type(prop_name):
                        return
                    self.remove_prop_row(existing_row)
                else:
                    action = self._ask_keep_or_inherit(prop_name)
                    if action == "remove_impl":
                        self._clear_implements()
                        return
                    if action == "keep":
                        self._mark_row_as_inherited(existing_row)
                        continue
                    self.remove_prop_row(existing_row)

            # Add as inherited
            prop_value = None if (is_from_interface or self.interface_mode) else prop.get("value", "")
            self._add_inherited_property(prop_name, prop_value, prop_type)

        self._loading_inherited = False
        self._revalidate_all_property_names()

    def _handle_existing_different_type(self, prop_name: str) -> bool:
        """Handle existing property with different type. Returns False to abort."""
        from PyQt6.QtWidgets import QMessageBox
        
        msg = QMessageBox(self)
        msg.setWindowTitle("Conflicto de herencia")
        msg.setText(
            f"La propiedad '{prop_name}' existe con tipo distinto."
            "\n¿Quieres eliminar la propiedad actual o quitar Implementa?"
        )
        btn_remove = msg.addButton("Eliminar propiedad", QMessageBox.ButtonRole.AcceptRole)
        btn_remove_impl = msg.addButton("Quitar Implementa", QMessageBox.ButtonRole.DestructiveRole)
        msg.exec()
        
        if msg.clickedButton() == btn_remove_impl:
            self._clear_implements()
            return False
        return True

    def _ask_keep_or_inherit(self, prop_name: str) -> str:
        """Ask user whether to keep, remove, or inherit existing property."""
        from PyQt6.QtWidgets import QMessageBox
        
        msg = QMessageBox(self)
        msg.setWindowTitle("Propiedad existente")
        msg.setText(
            f"La propiedad '{prop_name}' ya existe."
            "\n¿Quieres conservarla y marcarla como heredada, eliminarla, o quitar Implementa?"
        )
        btn_keep = msg.addButton("Conservar y heredar", QMessageBox.ButtonRole.AcceptRole)
        btn_remove = msg.addButton("Eliminar propiedad", QMessageBox.ButtonRole.ActionRole)
        btn_remove_impl = msg.addButton("Quitar Implementa", QMessageBox.ButtonRole.DestructiveRole)
        msg.exec()
        
        if msg.clickedButton() == btn_remove_impl:
            return "remove_impl"
        if msg.clickedButton() == btn_keep:
            return "keep"
        return "remove"

    def _add_inherited_property(self, key: str, value: Any, prop_type: str):
        """Add a property marked as inherited."""
        self.add_prop_row(key, value, prop_type)
        if self.rows:
            row_data = self.rows[-1]
            self._mark_row_as_inherited(row_data)

    def _clear_inherited_properties(self):
        """Clear all inherited properties."""
        for row_data in list(self.inherited_properties):
            self.props_layout.removeWidget(row_data.row_widget)
            row_data.row_widget.deleteLater()
            if row_data in self.rows:
                self.rows.remove(row_data)
        self.inherited_properties.clear()

    def _mark_row_as_inherited(self, row_data: PropertyRowData):
        """Mark a property row as inherited (read-only, styled)."""
        row_data.inherited = True
        row_data.key_edit.setReadOnly(True)
        row_data.key_edit.setStyleSheet("background-color: #1a1a2e; color: #888888;")
        
        if row_data.type_combo:
            row_data.type_combo.setEnabled(False)
            row_data.type_combo.setStyleSheet("background-color: #1a1a2e; color: #888888;")
            
        # Hide delete button
        for i in range(row_data.header_layout.count()):
            widget = row_data.header_layout.itemAt(i).widget()
            if widget and isinstance(widget, QPushButton) and widget.text() == "x":
                widget.hide()
                
        if row_data not in self.inherited_properties:
            self.inherited_properties.append(row_data)

    def _unmark_row_as_inherited(self, row_data: PropertyRowData):
        """Unmark a property row as inherited (make it editable again)."""
        row_data.inherited = False
        row_data.key_edit.setReadOnly(False)
        row_data.key_edit.setStyleSheet("")
        
        if row_data.type_combo:
            row_data.type_combo.setEnabled(True)
            row_data.type_combo.setStyleSheet("")
            
        # Show delete button
        for i in range(row_data.header_layout.count()):
            widget = row_data.header_layout.itemAt(i).widget()
            if widget and isinstance(widget, QPushButton) and widget.text() == "x":
                widget.show()
                
        if row_data in self.inherited_properties:
            self.inherited_properties.remove(row_data)

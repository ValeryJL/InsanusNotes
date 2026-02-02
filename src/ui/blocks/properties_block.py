from __future__ import annotations

from dataclasses import dataclass
from typing import Any, List, Optional

from PyQt6.QtCore import Qt, QEvent, pyqtSignal
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
    QInputDialog,
)

from .base import BaseBlock
from .config_loader import load_block_defaults, load_property_types


@dataclass
class _RowData:
    key_edit: QLineEdit
    type_combo: Optional[QComboBox]
    value_widget: QWidget
    row_widget: QWidget
    header_layout: QHBoxLayout
    complex_layout: QVBoxLayout
    inherited: bool = False


class ArrayItemsWidget(QWidget):
    """Contenedor para items de tipo Arreglo."""

    content_changed = pyqtSignal()

    def __init__(self, item_types: List[str], list_placeholder: str):
        super().__init__()
        self.item_types = item_types
        self.list_placeholder = list_placeholder
        self.items: List[_RowData] = []

        self.layout = QVBoxLayout(self)
        self.layout.setContentsMargins(16, 4, 4, 4)
        self.layout.setSpacing(4)

        add_btn = QPushButton("+ Agregar item")
        add_btn.setObjectName("PropAddButton")
        add_btn.clicked.connect(self._on_add_clicked)
        self.layout.addWidget(add_btn)

    def add_item(self, name: str = "", value: Any = "", item_type: str = "Texto"):
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

        value_widget = self._build_value_widget(item_type, value)
        if hasattr(value_widget, "textChanged"):
            value_widget.textChanged.connect(self.content_changed.emit)
        if hasattr(value_widget, "stateChanged"):
            value_widget.stateChanged.connect(self.content_changed.emit)
        if hasattr(value_widget, "valueChanged"):
            value_widget.valueChanged.connect(self.content_changed.emit)
        if hasattr(value_widget, "currentTextChanged"):
            value_widget.currentTextChanged.connect(self.content_changed.emit)

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

        row_data = _RowData(key_edit, type_combo, value_widget, row_widget, row_layout, QVBoxLayout())
        type_combo.currentTextChanged.connect(lambda t, row=row_data: self._replace_value_widget(row, t))

        self.layout.addWidget(row_widget)
        self.items.append(row_data)
        self.content_changed.emit()

    def _on_add_clicked(self):
        self.add_item()

    def _replace_value_widget(self, row_data: _RowData, new_type: str):
        row_layout = row_data.header_layout
        old_widget = row_data.value_widget
        idx = row_layout.indexOf(old_widget)
        if idx == -1:
            return
        new_widget = self._build_value_widget(new_type, "")
        row_layout.replaceWidget(old_widget, new_widget)
        old_widget.deleteLater()
        row_data.value_widget = new_widget
        if hasattr(new_widget, "textChanged"):
            new_widget.textChanged.connect(self.content_changed.emit)
        if hasattr(new_widget, "stateChanged"):
            new_widget.stateChanged.connect(self.content_changed.emit)
        if hasattr(new_widget, "valueChanged"):
            new_widget.valueChanged.connect(self.content_changed.emit)
        if hasattr(new_widget, "currentTextChanged"):
            new_widget.currentTextChanged.connect(self.content_changed.emit)
        self.content_changed.emit()

    def _build_value_widget(self, p_type: str, initial_value: Any) -> QWidget:
        if p_type == "Booleano":
            w = QCheckBox()
            if initial_value is not None:
                w.setChecked(bool(initial_value))
            return w
        if p_type == "Número":
            w = QDoubleSpinBox()
            w.setRange(-999999, 999999)
            w.setStyleSheet("background: transparent; border: none;")
            try:
                w.setValue(float(initial_value))
            except Exception:
                pass
            return w
        if p_type == "Lista":
            w = QComboBox()
            w.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
            w.addItem(self.list_placeholder)
            if initial_value:
                w.insertItem(0, str(initial_value))
                w.setCurrentIndex(0)
            return w
        w = QLineEdit(str(initial_value) if initial_value is not None else "")
        w.setObjectName("PropValue")
        w.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        return w

    def _remove_item(self, row_widget: QWidget):
        for idx, row in enumerate(list(self.items)):
            if row.row_widget is row_widget:
                self.items.pop(idx)
                break
        self.layout.removeWidget(row_widget)
        row_widget.deleteLater()
        self.content_changed.emit()

    def toggle_visibility(self, visible: bool):
        self.setVisible(visible)

    def get_data(self) -> list:
        data = []
        for row in self.items:
            name = row.key_edit.text().strip()
            p_type = row.type_combo.currentText() if row.type_combo else "Texto"
            val = ""
            if p_type == "Booleano":
                val = row.value_widget.isChecked() if hasattr(row.value_widget, "isChecked") else False
            elif p_type == "Número":
                val = row.value_widget.value() if hasattr(row.value_widget, "value") else 0
            elif p_type == "Lista":
                val = row.value_widget.currentText() if hasattr(row.value_widget, "currentText") else ""
                if val == self.list_placeholder:
                    val = ""
            else:
                val = row.value_widget.text() if hasattr(row.value_widget, "text") else ""
            data.append({"name": name, "value": val, "type": p_type})
        return data


class PropertiesBlock(BaseBlock):
    """Bloque de propiedades con soporte de herencia."""

    def __init__(self, interface_mode: bool = False, project_path: Optional[str] = None, is_interface: bool = False):
        super().__init__()
        defaults = load_block_defaults().get("PropertiesBlock", {})
        self.panel_title = defaults.get("panel_title", "PROPIEDADES")

        self.interface_mode = interface_mode
        self.project_path = project_path
        self.is_interface = is_interface
        self.rows: List[_RowData] = []
        self.inherited_properties: List[_RowData] = []
        self.has_inheritance_errors = False
        self._loading_data = False

        cfg = load_property_types()
        self.property_types = cfg.get("types", ["Texto", "Booleano", "Número", "Lista", "Arreglo"])
        self.list_placeholder = cfg.get("list_placeholder", "+ Agregar opción...")
        self.array_item_types = cfg.get("array_item_types", ["Texto", "Booleano", "Número", "Lista"])

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

        self.add_prop_row("Implementa", "")

    def _toggle_panel(self):
        visible = not self.props_container.isVisible()
        self.props_container.setVisible(visible)
        self.btn_add.setVisible(visible)

    def show_panel(self):
        self.props_container.setVisible(True)
        self.btn_add.setVisible(True)

    def hide_panel(self):
        self.props_container.setVisible(False)
        self.btn_add.setVisible(False)

    def add_prop_row(self, key: str = "", initial_value: Any = "", p_type: str = "Texto"):
        row_widget = QWidget()
        row_layout = QVBoxLayout(row_widget)
        row_layout.setContentsMargins(0, 0, 0, 0)
        row_layout.setSpacing(4)

        header_layout = QHBoxLayout()
        header_layout.setContentsMargins(0, 0, 0, 0)
        header_layout.setSpacing(6)

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

        if key == "Implementa":
            value_widget = QLineEdit(str(initial_value) if initial_value else "")
            value_widget.setObjectName("PropValue")
            value_widget.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
            completer = self._create_file_completer()
            if completer:
                value_widget.setCompleter(completer)
            value_widget.textChanged.connect(lambda: self._on_implements_changed(value_widget))
            value_widget.installEventFilter(self)
        else:
            type_combo = QComboBox()
            type_combo.setObjectName("PropType")
            type_combo.addItems(self.property_types)
            if p_type in self.property_types:
                type_combo.setCurrentText(p_type)
            value_widget = self._build_value_widget(p_type, initial_value)
            value_widget.installEventFilter(self)
            # La conexión se configura luego de crear row_data

        del_btn = QPushButton("x")
        del_btn.setObjectName("PropDelButton")

        sep = QFrame()
        sep.setObjectName("ItemSeparator")
        sep.setFrameShape(QFrame.Shape.VLine)

        header_layout.addWidget(key_edit)
        header_layout.addWidget(sep)
        if type_combo:
            header_layout.addWidget(type_combo)
        header_layout.addWidget(value_widget)
        header_layout.addWidget(del_btn)

        complex_layout = QVBoxLayout()
        complex_layout.setContentsMargins(0, 0, 0, 0)
        complex_layout.setSpacing(4)

        row_layout.addLayout(header_layout)
        row_layout.addLayout(complex_layout)

        row_data = _RowData(key_edit, type_combo, value_widget, row_widget, header_layout, complex_layout)
        del_btn.clicked.connect(lambda: self.remove_prop_row(row_data))
        if type_combo:
            type_combo.currentTextChanged.connect(lambda new_type, row=row_data: self._replace_value_widget(row, new_type))

        if key == "Implementa":
            del_btn.hide()

        self.props_layout.addWidget(row_widget)
        self.rows.append(row_data)

        if hasattr(value_widget, "related_container"):
            related_container = value_widget.related_container
            if related_container:
                complex_layout.addWidget(related_container)

        self.content_changed.emit()

    def _build_value_widget(self, p_type: str, initial_value: Any) -> QWidget:
        if self.interface_mode:
            placeholder = QLabel("")
            placeholder.setObjectName("PropValue")
            placeholder.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
            placeholder.setEnabled(False)
            return placeholder

        if p_type == "Booleano":
            w = QCheckBox()
            if initial_value is not None:
                w.setChecked(bool(initial_value))
            w.stateChanged.connect(self.content_changed.emit)
            return w
        if p_type == "Número":
            w = QDoubleSpinBox()
            w.setRange(-999999, 999999)
            w.setStyleSheet("background: transparent; border: none;")
            if initial_value is not None:
                try:
                    w.setValue(float(initial_value))
                except Exception:
                    pass
            w.valueChanged.connect(self.content_changed.emit)
            return w
        if p_type == "Lista":
            w = QComboBox()
            w.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
            w.setMinimumWidth(120)
            w.addItem(self.list_placeholder)
            w.activated.connect(lambda idx: self.handle_list_add(w, idx))
            if initial_value:
                w.insertItem(0, str(initial_value))
                w.setCurrentIndex(0)
            w.currentTextChanged.connect(self.content_changed.emit)
            return w
        if p_type == "Arreglo":
            toggle = QPushButton("▶")
            toggle.setObjectName("SmallToggle")
            toggle.setProperty("expanded", "false")
            toggle.setSizePolicy(QSizePolicy.Policy.Fixed, QSizePolicy.Policy.Fixed)
            related_container = ArrayItemsWidget(self.array_item_types, self.list_placeholder)
            related_container.setVisible(False)
            toggle.clicked.connect(lambda: self._toggle_related(toggle, related_container))
            toggle.related_container = related_container  # type: ignore[attr-defined]
            related_container.content_changed.connect(self.content_changed.emit)
            if isinstance(initial_value, list) and initial_value:
                for item in initial_value:
                    if isinstance(item, dict):
                        related_container.add_item(item.get("name", ""), item.get("value", ""), item.get("type", "Texto"))
                    else:
                        related_container.add_item("", item, "Texto")
                related_container.toggle_visibility(True)
                toggle.setText("▼")
                toggle.setProperty("expanded", "true")
            return toggle

        w = QLineEdit(str(initial_value) if initial_value else "")
        w.setObjectName("PropValue")
        w.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        w.setMinimumWidth(120)
        w.textChanged.connect(self.content_changed.emit)
        return w

    def _toggle_related(self, btn_toggle: QPushButton, related_container: ArrayItemsWidget):
        is_visible = not related_container.isVisible()
        related_container.toggle_visibility(is_visible)
        btn_toggle.setText("▼" if is_visible else "▶")
        btn_toggle.setProperty("expanded", "true" if is_visible else "false")

    def _replace_value_widget(self, row_data: _RowData, new_type: str):
        header_layout = row_data.header_layout
        complex_layout = row_data.complex_layout
        old_widget = row_data.value_widget
        new_widget = self._build_value_widget(new_type, "")

        if hasattr(old_widget, "related_container"):
            related_container = old_widget.related_container
            if related_container:
                complex_layout.removeWidget(related_container)
                related_container.setParent(None)

        if header_layout.indexOf(old_widget) != -1:
            header_layout.replaceWidget(old_widget, new_widget)
        else:
            header_layout.addWidget(new_widget)

        if hasattr(new_widget, "related_container"):
            related_container = new_widget.related_container
            if related_container:
                complex_layout.addWidget(related_container)

        old_widget.deleteLater()
        row_data.value_widget = new_widget
        self.content_changed.emit()

    def handle_list_add(self, combo, index):
        if combo.itemText(index) == self.list_placeholder:
            text, ok = QInputDialog.getText(self, "Nueva Opción", "Texto:")
            if ok and text:
                combo.insertItem(combo.count() - 1, text)
                combo.setCurrentText(text)
                self.content_changed.emit()
            else:
                combo.setCurrentIndex(-1)

    def remove_prop_row(self, row_data: _RowData):
        row_widget = row_data.row_widget
        if hasattr(row_data.value_widget, "related_container"):
            related_container = row_data.value_widget.related_container
            if related_container:
                row_data.complex_layout.removeWidget(related_container)
                related_container.deleteLater()
        self.props_layout.removeWidget(row_widget)
        row_widget.deleteLater()
        if row_data in self.rows:
            self.rows.remove(row_data)
        self.content_changed.emit()

    def get_data(self) -> dict:
        props = {}
        for row_data in self.rows:
            key = row_data.key_edit.text().strip()
            if not key:
                continue
            val = None
            p_type = "Texto"

            if key == "Implementa":
                if hasattr(row_data.value_widget, "text"):
                    val = row_data.value_widget.text()
                else:
                    val = ""
            else:
                p_type = row_data.type_combo.currentText() if row_data.type_combo else "Texto"
                if self.interface_mode:
                    val = None
                elif p_type == "Arreglo":
                    if hasattr(row_data.value_widget, "related_container"):
                        val = row_data.value_widget.related_container.get_data()  # type: ignore[attr-defined]
                    else:
                        val = []
                elif p_type == "Texto":
                    val = row_data.value_widget.text() if hasattr(row_data.value_widget, "text") else ""
                elif p_type == "Booleano":
                    val = row_data.value_widget.isChecked() if hasattr(row_data.value_widget, "isChecked") else False
                elif p_type == "Número":
                    val = row_data.value_widget.value() if hasattr(row_data.value_widget, "value") else 0
                elif p_type == "Lista":
                    if hasattr(row_data.value_widget, "currentText"):
                        val = row_data.value_widget.currentText()
                        if val == self.list_placeholder:
                            val = ""
                    else:
                        val = ""

            props[key] = {"type": p_type, "value": val, "inherit": bool(row_data.inherited)}
        return {"type": "properties", "content": props}

    def set_data(self, data: dict):
        self._loading_data = True
        self._clear_inherited_properties()
        for row_data in list(self.rows):
            self.props_layout.removeWidget(row_data.row_widget)
            row_data.row_widget.deleteLater()
        self.rows = []

        content = data.get("content", {}) if isinstance(data, dict) else {}

        impl_val = ""
        if "Implementa" in content:
            item = content["Implementa"]
            if isinstance(item, dict):
                impl_val = item.get("value", "")
            else:
                impl_val = str(item)
        self.add_prop_row("Implementa", impl_val)
        parent_map = self._get_inherited_prop_map(impl_val) if impl_val else {}

        for k, v in content.items():
            if k == "Implementa":
                continue
            p_type = "Texto"
            p_val = ""
            if isinstance(v, dict) and "type" in v:
                p_type = v.get("type", "Texto")
                p_val = v.get("value", "")
                inherit_flag = bool(v.get("inherit"))
            else:
                p_val = str(v)
                inherit_flag = False

            if inherit_flag and impl_val:
                parent_type = parent_map.get(k)
                if not parent_type:
                    inherit_flag = False
                elif parent_type != p_type:
                    inherit_flag = False
            self.add_prop_row(k, p_val, p_type)
            if inherit_flag and self.rows:
                self._mark_row_as_inherited(self.rows[-1])

        if impl_val:
            self._sync_inherited_properties(impl_val)

        if not self.is_interface and len(content) == 0:
            self.hide_panel()
        self._loading_data = False

    def eventFilter(self, obj, event):
        if event.type() == QEvent.Type.KeyPress and event.key() == Qt.Key.Key_Return:
            for row_data in self.rows:
                if obj is row_data.value_widget and isinstance(row_data.value_widget, QLineEdit):
                    self.add_prop_row()
                    return True
        return super().eventFilter(obj, event)

    def _create_file_completer(self):
        from PyQt6.QtWidgets import QCompleter
        from PyQt6.QtCore import Qt as QtCore
        from pathlib import Path

        if not self.project_path:
            return None

        files = []
        project_path = Path(self.project_path)
        extensions = ["**/*.inin"] if self.is_interface else ["**/*.mdin", "**/*.inin"]
        for pattern in extensions:
            for file_path in project_path.glob(pattern):
                if ".trash" in file_path.parts:
                    continue
                rel_path = file_path.relative_to(project_path)
                files.append(str(rel_path))

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
        if self._loading_data:
            return
        file_path = widget.text().strip()

        if not file_path:
            self._clear_inherited_properties()
            widget.setStyleSheet("")
            self.has_inheritance_errors = False
            return

        valid = self._validate_implements_file(file_path)
        if valid:
            duplicates = self._check_duplicate_properties(file_path)
            if duplicates:
                from PyQt6.QtWidgets import QMessageBox

                QMessageBox.warning(
                    self,
                    "Propiedades duplicadas",
                    "No se puede implementar '{file_path}' porque las siguientes propiedades ya existen:\n\n".format(
                        file_path=file_path
                    )
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
            else:
                widget.setStyleSheet("")
                self.has_inheritance_errors = False
                self._sync_inherited_properties(file_path)
        else:
            widget.setStyleSheet("border: 1px solid #ff4444; background-color: #331111;")
            self.has_inheritance_errors = True
            self._clear_inherited_properties()

    def _validate_implements_file(self, file_path: str) -> bool:
        from pathlib import Path
        import json

        if not self.project_path:
            return False

        full_path = Path(self.project_path) / file_path
        if not full_path.exists():
            return False
        if self.is_interface and full_path.suffix != ".inin":
            return False
        if full_path.suffix not in [".mdin", ".inin"]:
            return False

        try:
            with open(full_path, "r", encoding="utf-8") as f:
                content = f.read()
                if content.strip():
                    json.loads(content)
            return True
        except Exception:
            return False

    def _get_inherited_prop_map(self, file_path: str, _seen=None) -> dict:
        from pathlib import Path
        import json

        if not self.project_path:
            return {}
        if _seen is None:
            _seen = set()
        if file_path in _seen:
            return {}
        _seen.add(file_path)

        full_path = Path(self.project_path) / file_path
        if not full_path.exists():
            return {}

        try:
            with open(full_path, "r", encoding="utf-8") as f:
                content = f.read()
                if not content.strip():
                    return {}
                data = json.loads(content)

            prop_map = {}
            implements = None

            if isinstance(data, list):
                props_block = None
                for block in data:
                    if isinstance(block, dict) and block.get("type") == "properties":
                        props_block = block
                        break
                if props_block and isinstance(props_block.get("content"), dict):
                    for name, info in props_block.get("content", {}).items():
                        if name == "Implementa":
                            if isinstance(info, dict):
                                implements = info.get("value")
                            continue
                        if isinstance(info, dict):
                            prop_map[name] = info.get("type", "Texto")
                        else:
                            prop_map[name] = "Texto"
            else:
                for prop in data.get("properties", []):
                    if isinstance(prop, dict):
                        name = prop.get("name", "")
                        if name:
                            prop_map[name] = prop.get("type", "Texto")
                implements = data.get("implements")

            if implements:
                parent_map = self._get_inherited_prop_map(implements, _seen)
                parent_map.update(prop_map)
                return parent_map
            return prop_map
        except Exception:
            return {}

    def _check_duplicate_properties(self, file_path: str) -> list:
        from pathlib import Path
        import json

        if not self.project_path:
            return []

        full_path = Path(self.project_path) / file_path
        if not full_path.exists():
            return []

        try:
            with open(full_path, "r", encoding="utf-8") as f:
                content = f.read()
                if not content.strip():
                    return []
                data = json.loads(content)

            if isinstance(data, list):
                props_block = None
                for block in data:
                    if isinstance(block, dict) and block.get("type") == "properties":
                        props_block = block
                        break
                if props_block and isinstance(props_block.get("content"), dict):
                    inherited_names = {name for name in props_block.get("content", {}).keys() if name != "Implementa"}
                else:
                    inherited_names = set()
            else:
                inherited_names = set()
                for prop in data.get("properties", []):
                    if isinstance(prop, dict):
                        prop_name = prop.get("name", "")
                        if prop_name:
                            inherited_names.add(prop_name)

            own_names = set()
            for row_data in self.rows:
                if row_data in self.inherited_properties:
                    continue
                prop_name = row_data.key_edit.text().strip()
                if prop_name and prop_name != "Implementa":
                    own_names.add(prop_name)

            duplicates = inherited_names & own_names
            return sorted(list(duplicates))
        except Exception:
            return []

    def _validate_property_name(self, widget: QLineEdit, name: str):
        name = name.strip()
        if not name:
            widget.setStyleSheet("")
            return

        is_duplicate = False
        for row_data in self.inherited_properties:
            if row_data.key_edit.text().strip() == name:
                is_duplicate = True
                break

        if not is_duplicate:
            count = 0
            for row_data in self.rows:
                if row_data in self.inherited_properties:
                    continue
                if row_data.key_edit.text().strip() == name:
                    count += 1
                    if count > 1:
                        is_duplicate = True
                        break

        if is_duplicate:
            widget.setStyleSheet("border: 1px solid #ff4444; background-color: #331111;")
            self.has_inheritance_errors = True
        else:
            widget.setStyleSheet("")
            if not self._check_any_inheritance_errors():
                self.has_inheritance_errors = False

    def _revalidate_all_property_names(self):
        has_dup = False
        for row_data in self.rows:
            if row_data in self.inherited_properties:
                continue
            name = row_data.key_edit.text().strip()
            is_duplicate = False
            for inherited_row in self.inherited_properties:
                if inherited_row.key_edit.text().strip() == name and name:
                    is_duplicate = True
                    break
            if is_duplicate:
                row_data.key_edit.setStyleSheet("border: 1px solid #ff4444; background-color: #331111;")
                has_dup = True
            else:
                row_data.key_edit.setStyleSheet("")
        self.has_inheritance_errors = has_dup

    def _check_any_inheritance_errors(self) -> bool:
        for row_data in self.rows:
            if "#ff4444" in row_data.key_edit.styleSheet() or "#331111" in row_data.key_edit.styleSheet():
                return True
            if row_data.key_edit.text() == "Implementa":
                if hasattr(row_data.value_widget, "styleSheet"):
                    if "#ff4444" in row_data.value_widget.styleSheet() or "#331111" in row_data.value_widget.styleSheet():
                        return True
        return False

    def _load_inherited_properties(self, file_path: str):
        from pathlib import Path
        import json

        if not self.project_path:
            return

        full_path = Path(self.project_path) / file_path
        if not full_path.exists():
            return

        try:
            with open(full_path, "r", encoding="utf-8") as f:
                content = f.read()
                if not content.strip():
                    return
                data = json.loads(content)

            if isinstance(data, list):
                props_block = None
                for block in data:
                    if isinstance(block, dict) and block.get("type") == "properties":
                        props_block = block
                        break
                if props_block:
                    data = {"properties": [], "implements": None}
                    props_list = []
                    if isinstance(props_block.get("content"), dict):
                        for name, info in props_block.get("content", {}).items():
                            if name != "Implementa":
                                props_list.append(
                                    {
                                        "name": name,
                                        "type": info.get("type", "Texto") if isinstance(info, dict) else "Texto",
                                        "value": info.get("value", "") if isinstance(info, dict) else "",
                                    }
                                )
                            else:
                                if isinstance(info, dict):
                                    data["implements"] = info.get("value", "")
                    data["properties"] = props_list

            if not hasattr(self, "_loading_inherited"):
                self._clear_inherited_properties()
                self._loading_inherited = True

            if "implements" in data and data["implements"]:
                self._load_inherited_properties(data["implements"])

            properties = data.get("properties", [])
            is_from_interface = full_path.suffix == ".inin"

            for prop in properties:
                if not isinstance(prop, dict):
                    continue
                prop_name = prop.get("name", "")
                prop_type = prop.get("type", "Texto")
                if not prop_name:
                    continue

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
                            for row_data in self.rows:
                                if row_data.key_edit.text() == "Implementa":
                                    if hasattr(row_data.value_widget, "setText"):
                                        row_data.value_widget.setText("")
                            self._clear_inherited_properties()
                            return
                        self.remove_prop_row(existing_row)
                    else:
                        from PyQt6.QtWidgets import QMessageBox

                        msg = QMessageBox(self)
                        msg.setWindowTitle("Propiedad existente")
                        msg.setText(
                            f"La propiedad '{prop_name}' ya existe."
                            "\n¿Quieres conservarla y marcarla como heredada,"
                            " eliminarla, o quitar Implementa?"
                        )
                        btn_keep = msg.addButton("Conservar y heredar", QMessageBox.ButtonRole.AcceptRole)
                        btn_remove = msg.addButton("Eliminar propiedad", QMessageBox.ButtonRole.ActionRole)
                        btn_remove_impl = msg.addButton("Quitar Implementa", QMessageBox.ButtonRole.DestructiveRole)
                        msg.exec()
                        if msg.clickedButton() == btn_remove_impl:
                            for row_data in self.rows:
                                if row_data.key_edit.text() == "Implementa":
                                    if hasattr(row_data.value_widget, "setText"):
                                        row_data.value_widget.setText("")
                            self._clear_inherited_properties()
                            return
                        if msg.clickedButton() == btn_keep:
                            self._mark_row_as_inherited(existing_row)
                            continue
                        self.remove_prop_row(existing_row)
                if is_from_interface or self.interface_mode:
                    prop_value = None
                else:
                    prop_value = prop.get("value", "") if isinstance(prop, dict) else ""
                self._add_inherited_property(prop_name, prop_value, prop_type)

            self._loading_inherited = False
            self._revalidate_all_property_names()

        except Exception as e:
            print(f"Error loading inherited properties: {e}")
            self._loading_inherited = False

    def _add_inherited_property(self, key: str, value: Any, prop_type: str):
        self.add_prop_row(key, value, prop_type)
        if self.rows:
            row_data = self.rows[-1]
            self._mark_row_as_inherited(row_data)

    def _clear_inherited_properties(self):
        for row_data in list(self.inherited_properties):
            self.props_layout.removeWidget(row_data.row_widget)
            row_data.row_widget.deleteLater()
            if row_data in self.rows:
                self.rows.remove(row_data)
        self.inherited_properties.clear()

    def _mark_row_as_inherited(self, row_data: _RowData):
        row_data.inherited = True
        row_data.key_edit.setReadOnly(True)
        row_data.key_edit.setStyleSheet("background-color: #1a1a2e; color: #888888;")
        if row_data.type_combo:
            row_data.type_combo.setEnabled(False)
            row_data.type_combo.setStyleSheet("background-color: #1a1a2e; color: #888888;")
        for i in range(row_data.header_layout.count()):
            widget = row_data.header_layout.itemAt(i).widget()
            if widget and isinstance(widget, QPushButton) and widget.text() == "x":
                widget.hide()
        if row_data not in self.inherited_properties:
            self.inherited_properties.append(row_data)

    def _unmark_row_as_inherited(self, row_data: _RowData):
        row_data.inherited = False
        row_data.key_edit.setReadOnly(False)
        row_data.key_edit.setStyleSheet("")
        if row_data.type_combo:
            row_data.type_combo.setEnabled(True)
            row_data.type_combo.setStyleSheet("")
        for i in range(row_data.header_layout.count()):
            widget = row_data.header_layout.itemAt(i).widget()
            if widget and isinstance(widget, QPushButton) and widget.text() == "x":
                widget.show()
        if row_data in self.inherited_properties:
            self.inherited_properties.remove(row_data)

    def _sync_inherited_properties(self, file_path: str):
        parent_map = self._get_inherited_prop_map(file_path)
        if not parent_map:
            return

        from PyQt6.QtWidgets import QMessageBox

        row_by_name = {row.key_edit.text().strip(): row for row in self.rows if row.key_edit.text().strip()}

        # 1) Resolver heredadas que ya no existen en el padre
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
                    for row_data in self.rows:
                        if row_data.key_edit.text() == "Implementa":
                            if hasattr(row_data.value_widget, "setText"):
                                row_data.value_widget.setText("")
                    self._clear_inherited_properties()
                    return
                if msg.clickedButton() == btn_remove:
                    self.remove_prop_row(row)
                    continue
                self._unmark_row_as_inherited(row)

        # 2) Agregar o reconciliar propiedades del padre
        for name, p_type in parent_map.items():
            existing_row = row_by_name.get(name)
            if existing_row:
                same_type = True
                if existing_row.type_combo:
                    same_type = existing_row.type_combo.currentText() == p_type
                if existing_row.inherited and same_type:
                    continue
                if not same_type:
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
                        for row_data in self.rows:
                            if row_data.key_edit.text() == "Implementa":
                                if hasattr(row_data.value_widget, "setText"):
                                    row_data.value_widget.setText("")
                        self._clear_inherited_properties()
                        return
                    self.remove_prop_row(existing_row)
                else:
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
                        for row_data in self.rows:
                            if row_data.key_edit.text() == "Implementa":
                                if hasattr(row_data.value_widget, "setText"):
                                    row_data.value_widget.setText("")
                        self._clear_inherited_properties()
                        return
                    if msg.clickedButton() == btn_inherit:
                        self._mark_row_as_inherited(existing_row)
                    continue

            # no existe en el hijo -> agregar heredada
            self._add_inherited_property(name, None if self.interface_mode else "", p_type)

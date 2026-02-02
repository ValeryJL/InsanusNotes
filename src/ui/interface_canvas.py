"""Canvas para edición de interfaces (.inin)"""

from PyQt6.QtWidgets import QWidget, QVBoxLayout, QSizePolicy
from PyQt6.QtCore import Qt, pyqtSignal
from .blocks import HeaderBlock, PropertiesBlock, BaseBlock
import json

class InterfaceCanvas(QWidget):
    """Editor de interfaces - solo header y propiedades, sin cuerpo"""
    
    content_changed = pyqtSignal()

    def __init__(self, project_path=None):
        super().__init__()
        self.project_path = project_path
        self.setAttribute(Qt.WidgetAttribute.WA_StyledBackground, True)
        self.layout = QVBoxLayout(self)
        self.layout.setContentsMargins(0, 0, 0, 0)
        self.layout.setSpacing(0)

        # Content area
        self.content_area = QWidget()
        self.content_area.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        self.content_layout = QVBoxLayout(self.content_area)
        self.content_layout.setContentsMargins(0, 0, 0, 0)
        self.content_layout.setSpacing(0)

        # Blocks container
        self.blocks_container = QWidget()
        self.blocks_layout = QVBoxLayout(self.blocks_container)
        self.blocks_layout.setContentsMargins(0, 0, 0, 0)
        self.blocks_layout.setSpacing(2)
        self.blocks_layout.setAlignment(Qt.AlignmentFlag.AlignTop)

        self.content_layout.addWidget(self.blocks_container)
        self.layout.addWidget(self.content_area)

        self.blocks = []
        self.init_empty_interface()

    def init_empty_interface(self):
        """Crea la estructura de una interfaz vacía"""
        self.clear_blocks()
        
        # 1. Header (nombre de la interfaz)
        header = HeaderBlock()
        header.edit.setPlaceholderText("Nombre de la interfaz")
        self.add_block(header)
        
        # 2. Propiedades (modo interfaz: sin contenido)
        props = PropertiesBlock(interface_mode=True, project_path=self.project_path, is_interface=True)
        self.add_block(props)

    def add_block(self, block: BaseBlock):
        """Añade un bloque al canvas"""
        self.blocks_layout.addWidget(block)
        self.blocks.append(block)
        block.content_changed.connect(self.on_content_changed)
        block.split_requested.connect(lambda b: None)  # Interfaces no permiten split
        block.delete_requested.connect(lambda b: None)  # Interfaces no permiten delete
        block.got_focus.connect(self.on_block_focused)

    def clear_blocks(self):
        """Limpia todos los bloques"""
        for block in self.blocks:
            self.blocks_layout.removeWidget(block)
            block.deleteLater()
        self.blocks.clear()

    def on_content_changed(self):
        """Propaga señal de cambio"""
        self.content_changed.emit()

    def on_block_focused(self, block):
        """Maneja cuando un bloque recibe el foco"""
        pass  # No hay acciones especiales para interfaces

    def to_json(self) -> dict:
        """Exporta la interfaz a JSON"""
        if len(self.blocks) < 2:
            return {}
        
        header_block = self.blocks[0]
        props_block = self.blocks[1]
        
        # Header
        header_data = header_block.get_data() if hasattr(header_block, 'get_data') else {}
        
        # Properties (sin contenido, solo tipo)
        props_data = []
        if hasattr(props_block, 'get_data'):
            raw_props = props_block.get_data()
            content = raw_props.get("content", {})
            
            # Convertir diccionario a lista para interfaces
            for prop_name, prop_info in content.items():
                if prop_name == "Implementa":
                    # Implementa se guarda como está
                    continue
                
                prop_type = prop_info.get("type", "Texto")
                props_data.append({
                    "name": prop_name,
                    "type": prop_type,
                    "inherit": bool(prop_info.get("inherit"))
                })
        
        result = {
            "header": header_data,
            "properties": props_data
        }
        
        # Agregar Implementa si existe
        if hasattr(props_block, 'get_data'):
            raw_props = props_block.get_data()
            content = raw_props.get("content", {})
            if "Implementa" in content:
                impl_value = content["Implementa"].get("value", "")
                if impl_value and impl_value.strip():
                    result["implements"] = impl_value
        
        return result

    def from_json(self, data: dict):
        """Carga una interfaz desde JSON"""
        self.clear_blocks()
        
        # Recrear estructura
        header = HeaderBlock()
        header.edit.setPlaceholderText("Nombre de la interfaz")
        self.add_block(header)
        
        props = PropertiesBlock(interface_mode=True, project_path=self.project_path, is_interface=True)
        self.add_block(props)
        
        # Cargar datos del header
        if "header" in data and hasattr(header, 'set_data'):
            header.set_data(data["header"])
        
        # Cargar propiedades (sin contenido)
        if "properties" in data and hasattr(props, 'set_data'):
            # Convertir propiedades de interfaz a formato de PropertiesBlock
            props_dict = {}
            properties = data.get("properties", [])
            
            # Validar que sea una lista
            if isinstance(properties, list):
                for prop in properties:
                    # Validar que cada prop sea un diccionario
                    if isinstance(prop, dict):
                        name = prop.get("name", "")
                        prop_type = prop.get("type", "Texto")
                        props_dict[name] = {
                            "type": prop_type,
                            "value": "",  # Interfaces no tienen contenido
                            "inherit": bool(prop.get("inherit"))
                        }
            
            # Agregar implementa si existe
            if "implements" in data and data["implements"]:
                props_dict["Implementa"] = {
                    "type": "Texto",
                    "value": data["implements"]
                }
            
            props.set_data({"content": props_dict})

    def reset(self):
        """Resetea la interfaz a estado vacío"""
        self.init_empty_interface()

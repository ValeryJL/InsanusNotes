"""
Canvas del editor de notas.

Este módulo contiene el widget principal que gestiona los bloques del editor,
su organización y las señales de cambio de contenido.
"""

from PyQt6.QtWidgets import QWidget, QVBoxLayout, QScrollArea, QSizePolicy
from PyQt6.QtCore import Qt, pyqtSignal
from .blocks import HeaderBlock, PropertiesBlock, TextBlock, TableBlock, BaseBlock
import json

class EditorCanvas(QWidget):
    """
    Contenedor principal de bloques que forma la nota.
    
    Gestiona la estructura de una nota, que consiste en:
    1. HeaderBlock (título - obligatorio)
    2. PropertiesBlock (metadatos - obligatorio)
    3. Bloques de contenido (texto, tablas, etc.)
    
    Signals:
        content_changed: Emitida cuando hay cambios en cualquier bloque
        
    Attributes:
        project_path: Ruta al proyecto actual
        theme_manager: Gestor de temas para los bloques
        blocks: Lista de bloques en el canvas
        content_area: Widget contenedor principal
        blocks_container: Widget que contiene los bloques
    """
    
    content_changed = pyqtSignal() # Señal global de cambios

    def __init__(self, project_path=None, theme_manager=None):
        """
        Inicializa el canvas del editor.
        
        Args:
            project_path: Ruta al proyecto actual (opcional)
            theme_manager: Gestor de temas (opcional)
        """
        super().__init__()
        self.project_path = project_path
        self.theme_manager = theme_manager
        self.setAttribute(Qt.WidgetAttribute.WA_StyledBackground, True)
        self.layout = QVBoxLayout(self)
        self.layout.setContentsMargins(0, 0, 0, 0)
        self.layout.setSpacing(0)

        # Content area: fills available space in the scroll area
        self.content_area = QWidget()
        # use QSizePolicy.Policy.Expanding for both directions
        self.content_area.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        self.content_layout = QVBoxLayout(self.content_area)
        self.content_layout.setContentsMargins(0, 0, 0, 0)
        self.content_layout.setSpacing(0)

        # Blocks container: will size to its children and align them at the top
        self.blocks_container = QWidget()
        self.blocks_layout = QVBoxLayout(self.blocks_container)
        self.blocks_layout.setContentsMargins(0, 0, 0, 0)
        # make spacing small so blocks sit just below each other
        self.blocks_layout.setSpacing(2)
        self.blocks_layout.setAlignment(Qt.AlignmentFlag.AlignTop)

        self.content_layout.addWidget(self.blocks_container)
        self.layout.addWidget(self.content_area)

        self.blocks = []
        self.init_empty_note()

    def init_empty_note(self):
        """
        Crea la estructura obligatoria de una nota nueva.
        
        Una nota vacía consta de:
        1. HeaderBlock - Título de la nota
        2. PropertiesBlock - Metadatos y propiedades
        3. TextBlock - Primer bloque de contenido
        """
        self.clear_blocks()
        
        # 1. Header (Obligatorio)
        header = HeaderBlock()
        self.add_block(header)
        
        # 2. Propiedades (Obligatorio)
        props = PropertiesBlock(project_path=self.project_path, is_interface=False)
        self.add_block(props)
        
        # 3. Primer bloque de texto
        first_text = TextBlock(theme_manager=self.theme_manager)
        self.add_block(first_text)

    def add_block(self, block: BaseBlock, index=-1):
        """
        Añade un bloque al canvas.
        
        Args:
            block: Instancia del bloque a añadir
            index: Posición donde insertar (-1 para añadir al final)
            
        Note:
            Conecta automáticamente las señales del bloque al canvas.
        """
        if index == -1:
            self.blocks_layout.addWidget(block)
            self.blocks.append(block)
        else:
            # insert into blocks container at the correct visual index
            self.blocks_layout.insertWidget(index, block)
            self.blocks.insert(index, block)
        
        # Conectar señales
        block.got_focus.connect(self.handle_focus)
        block.content_changed.connect(self.content_changed.emit) # Propagar cambios
        
        if isinstance(block, TextBlock):
            # Do not create new blocks when split is requested; keep a single markdown body.
            block.split_requested.connect(self.handle_split)
            block.table_insert_requested.connect(self.handle_table_insert)
            block.delete_requested.connect(self.handle_delete)
        if isinstance(block, TableBlock):
            block.delete_requested.connect(self.handle_delete)
            
        self.content_changed.emit() # Señalar cambio estructural

    def handle_focus(self, focused_block):
        """Gestiona la visibilidad de propiedades basado en el foco"""
        # Buscar el bloque de propiedades
        props_block = None
        for b in self.blocks:
            if isinstance(b, PropertiesBlock):
                props_block = b
                break
        
        if not props_block:
            return

        # Lógica de visibilidad
        if isinstance(focused_block, HeaderBlock):
            props_block.show_panel()
        elif not isinstance(focused_block, PropertiesBlock):
            # Si el foco está en texto u otro bloque, ocultar propiedades
            props_block.hide_panel()

        # Solo el bloque enfocado queda en modo edición; el resto se renderiza sin interacción
        for b in self.blocks:
            if isinstance(b, TextBlock) and b is not focused_block:
                try:
                    b.update_preview()
                except Exception:
                    pass
                b.show_preview()
                try:
                    b.set_interactive(False)
                except Exception:
                    pass
            if isinstance(b, TableBlock) and b is not focused_block:
                try:
                    b.update_preview()
                    b.show_preview()
                except Exception:
                    pass

        if isinstance(focused_block, TextBlock):
            focused_block.preview.hide()
            focused_block.edit.show()
            try:
                focused_block.set_interactive(True)
            except Exception:
                pass
        if isinstance(focused_block, TableBlock):
            focused_block.preview.hide()
            focused_block.table_edit.show()

    def handle_split(self, current_block, new_text):
        """Divide el bloque actual e inserta un nuevo bloque de texto debajo"""
        try:
            idx = self.blocks.index(current_block)
        except ValueError:
            return

        # Crear bloque nuevo con el resto del texto
        new_block = TextBlock(new_text or "", theme_manager=self.theme_manager)
        self.add_block(new_block, index=idx + 1)

        try:
            current_block.update_preview()
            current_block.show_preview()
            current_block.set_interactive(False)
        except Exception:
            pass

        try:
            new_block.focus_in()
            self.handle_focus(new_block)
        except Exception:
            pass
        self.content_changed.emit()

    def handle_table_insert(self, block, before_text, table_data, after_text):
        try:
            idx = self.blocks.index(block)
        except ValueError:
            return

        self.blocks_layout.removeWidget(block)
        self.blocks.remove(block)
        block.deleteLater()

        insert_idx = idx
        before_block = TextBlock(before_text, theme_manager=self.theme_manager)
        self.add_block(before_block, index=insert_idx)
        insert_idx += 1

        table_block = TableBlock(table_data, theme_manager=self.theme_manager)
        self.add_block(table_block, index=insert_idx)
        insert_idx += 1

        after_block = TextBlock(after_text, theme_manager=self.theme_manager)
        self.add_block(after_block, index=insert_idx)

        try:
            after_block.focus_in()
            self.handle_focus(after_block)
        except Exception:
            pass
        self.content_changed.emit()

    def handle_delete(self, block):
        """Elimina un bloque y mueve el foco al anterior"""
        try:
            idx = self.blocks.index(block)
        except ValueError:
            return

        text_blocks = [b for b in self.blocks if isinstance(b, TextBlock)]
        can_delete_text = isinstance(block, TextBlock) and len(text_blocks) > 1

        if isinstance(block, HeaderBlock) or isinstance(block, PropertiesBlock):
            # No eliminar header/props
            if idx > 0 and idx < len(self.blocks):
                self.blocks[idx-1].focus_in()
            return

        if can_delete_text or idx > 2:
            self.blocks_layout.removeWidget(block)
            self.blocks.remove(block)
            block.deleteLater()
            # Foco al bloque anterior si existe, si no al siguiente
            if idx - 1 >= 0 and idx - 1 < len(self.blocks):
                self.blocks[idx-1].focus_in()
                self.handle_focus(self.blocks[idx-1])
            elif idx < len(self.blocks):
                self.blocks[idx].focus_in()
                self.handle_focus(self.blocks[idx])
            self.content_changed.emit()
        else:
            # Si no se puede borrar, solo mover foco al anterior
            if idx > 0 and idx < len(self.blocks):
                self.blocks[idx-1].focus_in()

    def clear_blocks(self):
        for block in self.blocks:
            self.blocks_layout.removeWidget(block)
            block.deleteLater()
        self.blocks = []
        # No emitimos change aquí porque suele ser parte de carga/init

    def apply_theme(self):
        """Propaga el cambio de tema a los bloques de texto."""
        for block in self.blocks:
            if isinstance(block, TextBlock):
                block.theme_manager = self.theme_manager
                try:
                    block.apply_theme()
                except Exception:
                    block.update_preview()

    def to_json(self) -> str:
        """Serializa la nota a JSON (.mdin)"""
        data = []
        for b in self.blocks:
            try:
                data.append(b.get_data())
            except Exception:
                pass
        return json.dumps(data, indent=2, ensure_ascii=False)

    def from_json(self, json_data: str):
        """Carga la nota desde JSON"""
        try:
            data = json.loads(json_data)
            if not isinstance(data, list):
                data = []
            self.clear_blocks()

            if not data:
                self.init_empty_note()
                return

            for block_data in data:
                b_type = block_data.get("type") if isinstance(block_data, dict) else None
                if b_type == "header":
                    block = HeaderBlock()
                    block.set_data(block_data)
                    self.add_block(block)
                elif b_type == "properties":
                    block = PropertiesBlock(project_path=self.project_path, is_interface=False)
                    block.set_data(block_data)
                    self.add_block(block)
                elif b_type == "text":
                    block = TextBlock(block_data.get("content", ""), theme_manager=self.theme_manager)
                    self.add_block(block)
                elif b_type == "table":
                    block = TableBlock(block_data.get("content", {}), theme_manager=self.theme_manager)
                    self.add_block(block)

            # Garantizar que existan header y props
            has_header = any(isinstance(b, HeaderBlock) for b in self.blocks)
            has_props = any(isinstance(b, PropertiesBlock) for b in self.blocks)
            if not has_header:
                self.add_block(HeaderBlock(), index=0)
            if not has_props:
                insert_idx = 1 if has_header else 0
                self.add_block(PropertiesBlock(project_path=self.project_path, is_interface=False), index=insert_idx)

            # Garantizar al menos un bloque de texto
            if not any(isinstance(b, TextBlock) for b in self.blocks):
                self.add_block(TextBlock(theme_manager=self.theme_manager))

            # Enfocar el último bloque de texto
            last_text = None
            for b in reversed(self.blocks):
                if isinstance(b, TextBlock):
                    last_text = b
                    break
            if last_text:
                try:
                    last_text.focus_in()
                    self.handle_focus(last_text)
                except Exception:
                    pass
        except Exception as e:
            print(f"Error cargando nota: {e}")
            self.init_empty_note()

    def reset_body(self):
        """Limpia el cuerpo de la nota manteniendo título y propiedades."""
        # find first TextBlock (expected at index 2)
        for b in self.blocks:
            if isinstance(b, TextBlock):
                try:
                    b.edit.clear()
                    b.update_preview()
                    b.focus_in()
                except Exception:
                    pass
                break

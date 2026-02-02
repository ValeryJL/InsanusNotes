from PyQt6.QtWidgets import (QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, 
                             QSplitter, QTreeView, QScrollArea, QFrame, QLabel,
                             QStatusBar, QInputDialog, QMessageBox, QPushButton,
                             QMenu, QAbstractItemView, QStyle, QSizePolicy)
from PyQt6.QtCore import Qt, QSize, QEvent, QTimer
from PyQt6.QtGui import QFileSystemModel, QAction, QIcon, QActionGroup, QKeyEvent
from pathlib import Path
import os
import json

from .project_selector import ProjectSelector
from .editor_canvas import EditorCanvas
from .interface_canvas import InterfaceCanvas
from .theme_manager import ThemeManager
from .trash_dialog import TrashDialog
from .file_icon_provider import CustomFileIconProvider
from pathlib import Path

class MainWindow(QMainWindow):
    """Ventana principal de InsanusNotes"""
    
    def __init__(self, project_manager):
        super().__init__()
        self.project_manager = project_manager
        self.theme_manager = ThemeManager()
        
        self.setWindowTitle("InsanusNotes")
        self.resize(1200, 800)
        
        # Timer de auto-guardado
        self.save_timer = QTimer(self)
        self.save_timer.setInterval(1000) # 1 segundo
        self.save_timer.setSingleShot(True)
        self.save_timer.timeout.connect(self.perform_auto_save)
        
        self.create_menu_bar()
        
        self.project_selector = None
        self.current_project_path = None
        self.current_file_path = None
        
        self.show_project_selector()

    def create_menu_bar(self):
        """Crea la barra de menú principal"""
        menubar = self.menuBar()
        
        # --- Menú Archivo ---
        file_menu = menubar.addMenu("&Archivo")
        
        # Nuevo Proyecto
        new_proj_action = QAction("Nuevo Proyecto", self)
        new_proj_action.setShortcut("Ctrl+Shift+N")
        new_proj_action.triggered.connect(lambda: self.show_project_selector())
        file_menu.addAction(new_proj_action)
        
        # Abrir Proyecto
        open_proj_action = QAction("Abrir Proyecto", self)
        open_proj_action.setShortcut("Ctrl+Shift+O")
        open_proj_action.triggered.connect(lambda: self.show_project_selector())
        file_menu.addAction(open_proj_action)
        
        file_menu.addSeparator()
        
        # Salir
        exit_action = QAction("Salir", self)
        exit_action.setShortcut("Ctrl+Q")
        exit_action.triggered.connect(self.close)
        file_menu.addAction(exit_action)
        
        # --- Menú Ver / Temas ---
        view_menu = menubar.addMenu("&Ver")
        
        theme_menu = view_menu.addMenu("Temas")
        theme_group = QActionGroup(self)
        
        # Cargar temas disponibles
        current_theme = self.theme_manager.current_theme_id
        
        for theme_id, theme_data in self.theme_manager.themes.items():
            name = theme_data.get("name", theme_id)
            action = QAction(name, self)
            action.setCheckable(True)
            action.setData(theme_id)
            
            if theme_id == current_theme:
                action.setChecked(True)
                
            action.triggered.connect(self.change_theme)
            theme_group.addAction(action)
            theme_menu.addAction(action)

    def change_theme(self):
        """Cambia el tema de la aplicación"""
        action = self.sender()
        if action and action.isChecked():
            theme_id = action.data()
            self.theme_manager.set_theme(theme_id)
            self.apply_theme()

    def show_project_selector(self):
        """Muestra el diálogo de selección de proyectos"""
        self.project_selector = ProjectSelector(self.project_manager)
        self.project_selector.project_selected.connect(self.on_project_selected)
        self.project_selector.exec()

    def on_project_selected(self, project_path: Path):
        """Maneja la selección de un proyecto"""
        self.current_project_path = project_path
        self.setup_ui_with_project(project_path)

    def setup_ui_with_project(self, project_path: Path):
        # Widget central y layout principal
        self.central_widget = QWidget()
        self.setCentralWidget(self.central_widget)
        self.main_layout = QHBoxLayout(self.central_widget)
        self.main_layout.setContentsMargins(0, 0, 0, 0)
        self.main_layout.setSpacing(0)
        
        # Splitter para separar explorador de editor
        self.splitter = QSplitter(Qt.Orientation.Horizontal)
        
        # --- Sidebar / Explorador ---
        self.sidebar = QWidget()
        self.sidebar.setObjectName("Sidebar")
        self.sidebar_layout = QVBoxLayout(self.sidebar)
        self.sidebar_layout.setContentsMargins(0, 0, 0, 0)
        self.sidebar_layout.setSpacing(0)
        
        # Header del explorador (Nombre + Botón +)
        self.sidebar_header_widget = QWidget()
        self.sidebar_header_widget.setObjectName("SidebarHeader")
        self.header_layout = QHBoxLayout(self.sidebar_header_widget)
        self.header_layout.setContentsMargins(15, 10, 10, 10)
        
        self.project_label = QLabel(project_path.name.upper())
        self.project_label.setObjectName("SidebarProjectName")
        self.header_layout.addWidget(self.project_label)
        
        self.header_layout.addStretch()
        
        self.btn_add_item = QPushButton()
        self.btn_add_item.setObjectName("BtnAddItem")
        self.btn_add_item.setIcon(self.style().standardIcon(QStyle.StandardPixmap.SP_FileIcon))
        self.btn_add_item.setFixedSize(30, 28)
        self.btn_add_item.setCursor(Qt.CursorShape.PointingHandCursor)
        self.btn_add_item.clicked.connect(self.show_creation_menu)
        self.header_layout.addWidget(self.btn_add_item)
        
        self.sidebar_layout.addWidget(self.sidebar_header_widget)
        
        # File System Model
        self.file_model = QFileSystemModel()
        self.file_model.setRootPath(str(project_path))
        self.file_model.setReadOnly(False) # Permitir renombrar y mover
        
        # Proveedor de iconos personalizado
        self.file_model.setIconProvider(CustomFileIconProvider())
        
        # Filtrar archivos (y ocultar .trash explícitamente si es necesario, aunque los dotfiles suelen ocultarse)
        self.file_model.setNameFilters(["*.mdin", "*.inin", "*.csvin", "*.md"])
        self.file_model.setNameFilterDisables(False)
        # Ocultar la carpeta .trash del modelo si no se oculta sola
        # QFileSystemModel muestra archivos ocultos según el SO, pero podemos filtrar
        
        # Tree View
        self.tree_view = QTreeView()
        self.tree_view.setModel(self.file_model)
        self.tree_view.setRootIndex(self.file_model.index(str(project_path)))
        self.tree_view.setHeaderHidden(True)
        self.tree_view.setColumnHidden(1, True) # Size
        self.tree_view.setColumnHidden(2, True) # Type
        self.tree_view.setColumnHidden(3, True) # Date
        
        # Desactivar edición de nombres de archivos
        self.tree_view.setEditTriggers(QAbstractItemView.EditTrigger.NoEditTriggers)
        
        # Configurar Drag & Drop
        self.tree_view.setDragEnabled(True)
        self.tree_view.setAcceptDrops(True)
        self.tree_view.setDropIndicatorShown(True)
        self.tree_view.setDragDropMode(QAbstractItemView.DragDropMode.InternalMove)
        self.tree_view.setDefaultDropAction(Qt.DropAction.MoveAction)
        
        # Instalar filtro de eventos para capturar Delete
        self.tree_view.installEventFilter(self)
        
        # Conectar doble clic
        self.tree_view.doubleClicked.connect(self.on_tree_double_click)
            
        self.sidebar_layout.addWidget(self.tree_view)
        
        # Botón Papelera (Abajo a la izquierda)
        self.trash_btn = QPushButton("🗑️ Papelera")
        self.trash_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        self.trash_btn.setStyleSheet("""
            QPushButton {
                background-color: transparent;
                border: none;
                color: #888888;
                text-align: left;
                padding: 10px;
            }
            QPushButton:hover {
                color: #e0e0e0;
                background-color: #333333;
            }
        """)
        self.trash_btn.clicked.connect(self.open_trash_dialog)
        self.sidebar_layout.addWidget(self.trash_btn)
        
        # --- Área del Editor ---
        self.editor_container = QScrollArea()
        self.editor_container.setWidgetResizable(True)
        self.editor_container.setFrameShape(QFrame.Shape.NoFrame)
        
        self.editor_canvas = EditorCanvas(project_path=project_path, theme_manager=self.theme_manager)
        self.editor_canvas.setObjectName("EditorCanvas")
        self.editor_canvas.content_changed.connect(self.schedule_auto_save)
        
        self.interface_canvas = InterfaceCanvas(project_path=project_path)
        self.interface_canvas.setObjectName("InterfaceCanvas")
        self.interface_canvas.content_changed.connect(self.schedule_auto_save)

        # small save status indicator (used by schedule_auto_save)
        self.save_status_label = QLabel("")
        self.save_status_label.setStyleSheet("color: gray; font-size: 12px;")
        
        # Área del editor ocupa todo el espacio disponible (no centrado)
        self.editor_container.setWidget(self.editor_canvas)
        self.editor_container.setWidgetResizable(True)
        # hide editor area until a file is opened
        self.editor_container.setVisible(False)
        
        self.current_canvas_type = "note"  # "note" o "interface"
        
        # Agregar a splitter
        self.splitter.addWidget(self.sidebar)
        self.splitter.addWidget(self.editor_container)
        self.splitter.setStretchFactor(1, 4)
        
        self.main_layout.addWidget(self.splitter)
        
        # Status Bar
        self.setStatusBar(QStatusBar())
        self.statusBar().showMessage(f"Proyecto: {project_path.name}")
        # add the small save indicator to the status bar
        try:
            self.statusBar().addPermanentWidget(self.save_status_label)
        except Exception:
            pass
        
        # Aplicar tema
        self.apply_theme()

    def schedule_auto_save(self):
        """Programa el auto-guardado y actualiza el indicador"""
        self.save_status_label.setText("💾") # Indicador de cambios no guardados
        if not self.current_file_path:
            self.save_status_label.setText("⚠️")
            self.statusBar().showMessage("⚠️ No hay archivo para guardar", 3000)
            return
        self.save_timer.start()

    def perform_auto_save(self):
        """Ejecuta el guardado automático"""
        if not self.current_file_path:
            self.save_status_label.setText("⚠️")
            self.statusBar().showMessage("⚠️ No hay archivo para guardar", 3000)
            return
        saved = self.save_current_note(self.current_file_path)
        if saved:
            self.save_status_label.setText("✅")
        else:
            self.save_status_label.setText("⚠️")
            self.statusBar().showMessage("⚠️ No se pudo guardar", 3000)

    def apply_theme(self):
        self.setStyleSheet(self.theme_manager.generate_qss())

        # Re-render previews con el tema actualizado
        if hasattr(self, "editor_canvas") and self.editor_canvas:
            try:
                self.editor_canvas.theme_manager = self.theme_manager
                if hasattr(self.editor_canvas, "apply_theme"):
                    self.editor_canvas.apply_theme()
            except Exception:
                pass

        if hasattr(self, "interface_canvas") and self.interface_canvas:
            try:
                if hasattr(self.interface_canvas, "apply_theme"):
                    self.interface_canvas.apply_theme()
            except Exception:
                pass

    def show_creation_menu(self):
        """Muestra el menú desplegable para crear nuevos items"""
        menu = QMenu(self)
        
        # Acciones
        action_note = QAction("📝 Nueva Nota", self)
        action_note.triggered.connect(self.new_note)
        
        action_interface = QAction("🖥️ Nueva Interfaz", self)
        action_interface.triggered.connect(self.new_interface)
        
        action_data = QAction("📊 Nueva Tabla", self)
        action_data.triggered.connect(self.new_data)
        
        menu.addSeparator()
        
        action_folder = QAction("📁 Nueva Carpeta", self)
        action_folder.triggered.connect(self.new_folder)
        
        menu.addAction(action_note)
        menu.addAction(action_interface)
        menu.addAction(action_data)
        menu.addSeparator()
        menu.addAction(action_folder)
        
        # Mostrar menú debajo del botón
        menu.exec(self.btn_add_item.mapToGlobal(self.btn_add_item.rect().bottomLeft()))
    
    def has_validation_errors(self) -> bool:
        """Verifica si el archivo actual tiene errores de validación de herencia"""
        if not hasattr(self, 'current_canvas_type'):
            return False
        
        # Obtener el canvas activo
        canvas = None
        if self.current_canvas_type == "note":
            canvas = self.editor_canvas
        elif self.current_canvas_type == "interface":
            canvas = self.interface_canvas
        else:
            return False
        
        if not canvas or not hasattr(canvas, 'blocks'):
            return False
        
        # Buscar bloques de propiedades con errores de herencia
        from .blocks import PropertiesBlock
        for block in canvas.blocks:
            if isinstance(block, PropertiesBlock):
                if hasattr(block, 'has_inheritance_errors') and block.has_inheritance_errors:
                    return True
        
        return False

    def on_tree_double_click(self, index):
        """Maneja el doble clic en el árbol de archivos"""
        file_path = Path(self.file_model.filePath(index))
        if file_path.is_file():
            # Verificar errores antes de cambiar de archivo
            if self.has_validation_errors():
                from PyQt6.QtWidgets import QMessageBox
                reply = QMessageBox.warning(
                    self,
                    "Errores de validación",
                    "El archivo actual tiene errores de validación.\n\n"
                    "Los cambios desde el último guardado exitoso no se guardarán.\n\n"
                    "¿Estás seguro que querés salir?",
                    QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
                    QMessageBox.StandardButton.No
                )
                if reply == QMessageBox.StandardButton.No:
                    return
            
            self.open_project_file(file_path)

    def open_project_file(self, file_path: Path):
        """Abre un archivo del proyecto en el editor"""
        # Guardar archivo anterior si existe y está pendiente
        if self.save_timer.isActive():
            self.perform_auto_save()
            
        self.current_file_path = file_path # Guardar referencia al archivo actual
        
        if file_path.suffix == ".mdin":
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    json_data = f.read()
                self.editor_canvas.from_json(json_data)
                
                # Cambiar widget en el contenedor
                self.editor_container.takeWidget()  # Remover widget actual
                self.editor_container.setWidget(self.editor_canvas)
                self.current_canvas_type = "note"
                self.editor_container.setVisible(True)
                self.statusBar().showMessage(f"Abierto: {file_path.name}")
                self.save_status_label.setText("") # Reset status
            except Exception as e:
                 self.statusBar().showMessage(f"Error al abrir: {str(e)}")
        elif file_path.suffix == ".inin":
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if content.strip():
                        json_data = json.loads(content)
                    else:
                        json_data = {}
                self.interface_canvas.from_json(json_data)
                
                # Cambiar widget en el contenedor
                self.editor_container.takeWidget()  # Remover widget actual
                self.editor_container.setWidget(self.interface_canvas)
                self.current_canvas_type = "interface"
                self.editor_container.setVisible(True)
                self.statusBar().showMessage(f"Abierto: {file_path.name}")
                self.save_status_label.setText("") # Reset status
            except Exception as e:
                 self.statusBar().showMessage(f"Error al abrir interfaz: {str(e)}")
        else:
            self.statusBar().showMessage(f"Tipo de archivo no soportado aún: {file_path.name}")

    def save_current_note(self, file_path: Path) -> bool:
        """Guarda la nota o interfaz actual de forma atómica y segura"""
        # Verificar errores de herencia antes de guardar
        if self.has_validation_errors():
            self.statusBar().showMessage("⚠️ No se puede guardar: hay errores de herencia que deben corregirse")
            return False
        
        # Fallback si no hay tipo de canvas definido
        if not hasattr(self, 'current_canvas_type') or not self.current_canvas_type:
            if file_path.suffix == ".inin":
                self.current_canvas_type = "interface"
            else:
                self.current_canvas_type = "note"
        
        temp_path = None
        try:
            # 1. Generar datos en memoria primero
            if self.current_canvas_type == "interface":
                data_dict = self.interface_canvas.to_json()
                json_data = json.dumps(data_dict, indent=2, ensure_ascii=False)
            else:
                json_data = self.editor_canvas.to_json()
            
            # 2. Escribir a archivo temporal
            temp_path = file_path.with_suffix(file_path.suffix + ".tmp")
            
            with open(temp_path, 'w', encoding='utf-8') as f:
                f.write(json_data)
                f.flush()
                os.fsync(f.fileno()) # Forzar escritura física en disco
            
            # 3. Renombrado atómico (Sobreescribe el original de golpe)
            os.replace(temp_path, file_path)
            
            self.statusBar().showMessage(f"Guardado: {file_path.name} ({QTimer.remainingTime(self.save_timer) if self.save_timer.isActive() else 'Auto'})")
            return True
            
        except Exception as e:
            self.statusBar().showMessage(f"Error CRÍTICO al guardar: {e}")
            # Intentar limpiar basura
            if temp_path and temp_path.exists():
                try: temp_path.unlink()
                except: pass
            return False

    def _get_current_dir(self) -> Path:
        """Obtiene el directorio seleccionado o la raíz del proyecto"""
        index = self.tree_view.currentIndex()
        if index.isValid():
            path = Path(self.file_model.filePath(index))
            if path.is_dir():
                return path
            return path.parent
        return self.current_project_path

    def new_note(self):
        """Crea una nueva nota"""
        if not self.current_project_path:
            return
            
        base_dir = self._get_current_dir()
        name, ok = QInputDialog.getText(self, "Nueva Nota", "Nombre de la nota:")
        if ok and name.strip():
            # Asegurar extensión
            filename = name.strip()
            if not filename.endswith(".mdin"):
                filename += ".mdin"
                
            note_path = base_dir / filename
            
            # Inicializar editor con nota vacía
            self.editor_canvas.init_empty_note()
            self.current_file_path = note_path # Set current path
            self.current_canvas_type = "note"
            
            # Cambiar al canvas de notas
            self.editor_container.takeWidget()
            self.editor_container.setWidget(self.editor_canvas)
            self.editor_container.setVisible(True)
            
            # Guardar inmediatamente
            self.save_current_note(note_path)
            
            self.statusBar().showMessage(f"Nota creada: {filename}")

    def new_interface(self):
        """Crea una nueva interfaz"""
        if not self.current_project_path:
            return
            
        base_dir = self._get_current_dir()
        name, ok = QInputDialog.getText(self, "Nueva Interfaz", "Nombre de la interfaz:")
        if ok and name.strip():
            filename = name.strip()
            if not filename.endswith(".inin"):
                filename += ".inin"
            
            interface_path = base_dir / filename
            
            # Inicializar editor con interfaz vacía
            self.interface_canvas.init_empty_interface()
            self.current_file_path = interface_path
            self.current_canvas_type = "interface"
            
            # Cambiar al canvas de interfaces
            self.editor_container.takeWidget()
            self.editor_container.setWidget(self.interface_canvas)
            self.editor_container.setVisible(True)
            
            # Guardar inmediatamente
            self.save_current_note(interface_path)
            
            self.statusBar().showMessage(f"Interfaz creada: {filename}")

    def new_data(self):
        """Crea una nueva tabla de datos"""
        if not self.current_project_path:
            return
            
        base_dir = self._get_current_dir()
        name, ok = QInputDialog.getText(self, "Nueva Tabla", "Nombre de la tabla:")
        if ok and name.strip():
            filename = name.strip()
            if not filename.endswith(".csvin"):
                filename += ".csvin"
            
            file_path = base_dir / filename
            file_path.touch()
            self.statusBar().showMessage(f"Tabla creada: {filename}")

    def new_folder(self):
        """Crea una nueva carpeta"""
        if not self.current_project_path:
            return
            
        base_dir = self._get_current_dir()
        name, ok = QInputDialog.getText(self, "Nueva Carpeta", "Nombre de la carpeta:")
        if ok and name.strip():
            folder_path = base_dir / name.strip()
            try:
                folder_path.mkdir(exist_ok=False)
                self.statusBar().showMessage(f"Carpeta creada: {name.strip()}")
            except FileExistsError:
                QMessageBox.warning(self, "Error", "La carpeta ya existe.")
            except Exception as e:
                QMessageBox.critical(self, "Error", f"No se pudo crear la carpeta: {e}")

    def eventFilter(self, source, event):
        """Filtro de eventos global"""
        if event.type() == QEvent.Type.KeyPress and source is self.tree_view:
            if event.key() == Qt.Key.Key_Delete:
                self.delete_selected_item()
                return True
        return super().eventFilter(source, event)

    def delete_selected_item(self):
        """Mueve el archivo seleccionado a la papelera"""
        index = self.tree_view.currentIndex()
        if not index.isValid():
            return
            
        file_path = Path(self.file_model.filePath(index))
        
        reply = QMessageBox.question(
            self, "Mover a papelera", 
            f"¿Quieres mover '{file_path.name}' a la papelera?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        
        if reply == QMessageBox.StandardButton.Yes:
            try:
                self.project_manager.current_project.move_to_trash(file_path)
                self.statusBar().showMessage(f"Movido a papelera: {file_path.name}")
            except Exception as e:
                QMessageBox.critical(self, "Error", f"No se pudo eliminar: {e}")

    def open_trash_dialog(self):
        """Abre la papelera de reciclaje"""
        if not self.project_manager.current_project:
            return
            
        dialog = TrashDialog(self.project_manager.current_project, self)
        dialog.exec()
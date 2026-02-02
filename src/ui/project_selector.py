from PyQt6.QtWidgets import (QDialog, QVBoxLayout, QHBoxLayout, QLabel, 
                             QPushButton, QFileDialog, QFrame, QScrollArea, 
                             QListWidget, QListWidgetItem, QProgressBar,
                             QInputDialog, QMessageBox)
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QIcon
from pathlib import Path
from typing import List

class ProjectSelector(QDialog):
    """Diálogo para seleccionar, crear o abrir proyectos"""
    
    project_selected = pyqtSignal(Path)

    def __init__(self, project_manager):
        super().__init__()
        self.project_manager = project_manager
        self.setWindowTitle("Seleccionar Proyecto")
        self.setModal(True)
        self.resize(600, 500)
        
        self.setup_ui()
        self.load_recent_projects()

    def setup_ui(self):
        self.main_layout = QVBoxLayout(self)
        
        # Header
        header = QLabel("📝 InsanusNotes")
        header.setStyleSheet("font-size: 24px; font-weight: bold; margin-bottom: 20px;")
        self.main_layout.addWidget(header)
        
        # Sección de proyectos recientes
        recent_section = QFrame()
        recent_section.setFrameShape(QFrame.Shape.StyledPanel)
        recent_section.setFrameShadow(QFrame.Shadow.Raised)
        recent_section.setStyleSheet("background: #f8f9fa; border-radius: 8px; padding: 15px;")
        
        recent_layout = QVBoxLayout(recent_section)
        
        recent_title = QLabel("Proyectos Recientes")
        recent_title.setStyleSheet("font-weight: bold; color: #333333;")
        recent_layout.addWidget(recent_title)
        
        self.recent_list = QListWidget()
        recent_layout.addWidget(self.recent_list)
        
        self.main_layout.addWidget(recent_section)
        
        # Sección de acciones
        actions_frame = QFrame()
        actions_layout = QHBoxLayout(actions_frame)
        actions_layout.setContentsMargins(0, 0, 0, 0)
        
        self.btn_new = QPushButton("➕ Nuevo Proyecto")
        self.btn_new.setStyleSheet("background-color: #007bff; color: white; padding: 10px 20px; border-radius: 5px;")
        self.btn_new.clicked.connect(self.create_new_project)
        actions_layout.addWidget(self.btn_new)
        
        self.btn_open = QPushButton("📂 Abrir Proyecto")
        self.btn_open.setStyleSheet("background-color: #28a745; color: white; padding: 10px 20px; border-radius: 5px; margin-left: 10px;")
        self.btn_open.clicked.connect(self.open_project_dialog)
        actions_layout.addWidget(self.btn_open)
        
        self.main_layout.addWidget(actions_frame)
        
        # Botón de cancelar
        cancel_btn = QPushButton("× Cancelar")
        cancel_btn.setStyleSheet("background-color: #dc3545; color: white; padding: 8px 15px; border-radius: 4px;")
        cancel_btn.clicked.connect(self.reject)
        self.main_layout.addWidget(cancel_btn)
        
        # Mensaje de ayuda
        help_text = QLabel("Selecciona un proyecto reciente o crea uno nuevo en una carpeta vacía.")
        help_text.setStyleSheet("color: #666666; font-size: 11px; margin-top: 15px;")
        self.main_layout.addWidget(help_text)

    def load_recent_projects(self):
        """Carga proyectos recientes en la lista"""
        self.recent_list.clear()
        recent_paths = self.project_manager.get_recent_projects()
        
        for path in recent_paths:
            item = QListWidgetItem(path.name)
            item.setData(Qt.ItemDataRole.UserRole, str(path.absolute()))
            item.setToolTip(str(path.absolute()))
            self.recent_list.addItem(item)
        
        if recent_paths:
            self.recent_list.itemClicked.connect(self.on_recent_project_clicked)

    def on_recent_project_clicked(self, item):
        """Maneja clic en proyecto reciente"""
        project_path = Path(item.data(Qt.ItemDataRole.UserRole))
        if project_path.exists():
            # Abrir proyecto en el manager para actualizar estado
            self.project_manager.open_project(project_path)
            self.project_selected.emit(project_path)
            self.accept()
        else:
            # Eliminar de recientes si ya no existe
            self.project_manager.recent_projects.remove(str(project_path))
            self.project_manager._save_recent()
            self.load_recent_projects()

    def create_new_project(self):
        """Abre diálogo para crear nuevo proyecto"""
        folder_path = QFileDialog.getExistingDirectory(
            self, 
            "Seleccionar carpeta para el nuevo proyecto", 
            str(Path.home()),
            QFileDialog.Option.ShowDirsOnly | QFileDialog.Option.DontResolveSymlinks
        )
        
        if folder_path:
            # Preguntar nombre del proyecto
            project_name, ok = QInputDialog.getText(self, "Nombre del Proyecto", "Nombre:")
            if ok and project_name.strip():
                try:
                    project = self.project_manager.create_project(Path(folder_path), project_name.strip())
                    self.project_selected.emit(project.path)
                    self.accept()
                except Exception as e:
                    self.show_error("Error al crear proyecto", str(e))

    def open_project_dialog(self):
        """Abre diálogo para seleccionar proyecto existente"""
        project_path = QFileDialog.getExistingDirectory(
            self, 
            "Seleccionar proyecto existente", 
            str(Path.home()),
            QFileDialog.Option.ShowDirsOnly | QFileDialog.Option.DontResolveSymlinks
        )
        
        if project_path:
            try:
                project = self.project_manager.open_project(Path(project_path))
                self.project_selected.emit(project.path)
                self.accept()
            except Exception as e:
                self.show_error("Error al abrir proyecto", str(e))

    def show_error(self, title, message):
        """Muestra un mensaje de error"""
        msg_box = QMessageBox()
        msg_box.setIcon(QMessageBox.Icon.Critical)
        msg_box.setWindowTitle(title)
        msg_box.setText(message)
        msg_box.exec()

from PyQt6.QtWidgets import (QDialog, QVBoxLayout, QHBoxLayout, QListWidget, 
                             QListWidgetItem, QPushButton, QLabel, QMessageBox, 
                             QWidget, QTextEdit, QSplitter, QFrame)
from PyQt6.QtCore import Qt
from datetime import datetime
import json
import os

class TrashDialog(QDialog):
    """Diálogo para gestionar la papelera de reciclaje con vista previa"""
    
    def __init__(self, project, parent=None):
        super().__init__(parent)
        self.project = project
        self.setWindowTitle("Papelera de Reciclaje")
        self.resize(900, 600)
        self.setup_ui()
        self.load_items()

    def setup_ui(self):
        main_layout = QVBoxLayout(self)
        
        # Header
        header = QLabel("Archivos eliminados (se borrarán permanentemente en 30 días)")
        header.setStyleSheet("color: gray; font-style: italic; margin-bottom: 2px; font-size: 10px;")
        main_layout.addWidget(header)
        
        # Splitter principal (Lista | Preview)
        self.splitter = QSplitter(Qt.Orientation.Horizontal)
        
        # --- Lado Izquierdo: Lista ---
        list_container = QWidget()
        list_layout = QVBoxLayout(list_container)
        list_layout.setContentsMargins(0, 0, 0, 0)
        
        self.list_widget = QListWidget()
        self.list_widget.setSelectionMode(QListWidget.SelectionMode.ExtendedSelection)
        self.list_widget.itemSelectionChanged.connect(self.on_selection_changed)
        list_layout.addWidget(self.list_widget)
        
        self.splitter.addWidget(list_container)
        
        # --- Lado Derecho: Preview ---
        self.preview_container = QFrame()
        self.preview_container.setFrameShape(QFrame.Shape.StyledPanel)
        self.preview_container.setStyleSheet("background-color: white; border-radius: 4px;")
        preview_layout = QVBoxLayout(self.preview_container)
        
        preview_label = QLabel("Vista Previa")
        preview_label.setStyleSheet("font-weight: bold; color: #555;")
        preview_layout.addWidget(preview_label)
        
        self.preview_text = QTextEdit()
        self.preview_text.setReadOnly(True)
        self.preview_text.setStyleSheet("border: none; font-family: monospace;")
        preview_layout.addWidget(self.preview_text)
        
        self.splitter.addWidget(self.preview_container)
        
        # Ocultar inicialmente
        self.preview_container.setVisible(False)
        
        # Configurar proporciones (Lista 40%, Preview 60%)
        self.splitter.setStretchFactor(0, 2)
        self.splitter.setStretchFactor(1, 3)
        
        main_layout.addWidget(self.splitter, 1)
        
        # --- Botones ---
        btn_layout = QHBoxLayout()
        
        self.btn_restore = QPushButton("Restaurar Seleccionado")
        self.btn_restore.clicked.connect(self.restore_selected)
        self.btn_restore.setEnabled(False)
        
        self.btn_delete_perm = QPushButton("Eliminar Permanentemente")
        self.btn_delete_perm.setStyleSheet("color: #dc3545;")
        self.btn_delete_perm.clicked.connect(self.delete_permanently)
        self.btn_delete_perm.setEnabled(False)
        
        self.btn_empty = QPushButton("Vaciar Todo")
        self.btn_empty.setStyleSheet("background-color: #dc3545; color: white;")
        self.btn_empty.clicked.connect(self.empty_trash)
        
        self.btn_close = QPushButton("Cerrar")
        self.btn_close.clicked.connect(self.accept)
        
        btn_layout.addWidget(self.btn_restore)
        btn_layout.addWidget(self.btn_delete_perm)
        btn_layout.addStretch()
        btn_layout.addWidget(self.btn_empty)
        btn_layout.addWidget(self.btn_close)
        
        main_layout.addLayout(btn_layout)

    def load_items(self):
        self.list_widget.clear()
        self.preview_text.clear()
        index = self.project._load_trash_index()
        
        for unique_name, data in index.items():
            original_name = data.get("original_name", "Desconocido")
            deleted_ts = data.get("deleted_at", 0)
            deleted_date = datetime.fromtimestamp(deleted_ts).strftime("%Y-%m-%d %H:%M")
            original_path = data.get("original_path", "")
            
            # Icono simple basado en extensión
            icon = "📄"
            if data.get("is_dir"): icon = "📁"
            elif original_name.endswith(".mdin"): icon = "📝"
            elif original_name.endswith(".inin"): icon = "🖥️"
            elif original_name.endswith(".csvin"): icon = "📊"
            
            item_text = f"{icon} {original_name}\n    De: {original_path}\n    Borrado: {deleted_date}"
            item = QListWidgetItem(item_text)
            item.setData(Qt.ItemDataRole.UserRole, unique_name)
            item.setData(Qt.ItemDataRole.UserRole + 1, original_name)
            self.list_widget.addItem(item)

    def on_selection_changed(self):
        items = self.list_widget.selectedItems()
        count = len(items)
        
        self.btn_restore.setEnabled(count > 0)
        self.btn_delete_perm.setEnabled(count > 0)
        
        if count == 1:
            self.show_preview(items[0])
            self.preview_container.setVisible(True)
        else:
            self.preview_text.clear()
            self.preview_container.setVisible(False)


    def show_preview(self, item):
        unique_name = item.data(Qt.ItemDataRole.UserRole)
        original_name = item.data(Qt.ItemDataRole.UserRole + 1)
        file_path = self.project.trash_dir / unique_name
        
        if not file_path.exists():
            self.preview_text.setText("El archivo no se encuentra.")
            return
            
        if file_path.is_dir():
            self.preview_text.setText("[Carpeta]\nNo hay vista previa disponible para carpetas.")
            return

        try:
            content = ""
            with open(file_path, 'r', encoding='utf-8') as f:
                raw_content = f.read()
                
            if original_name.endswith(".mdin") or original_name.endswith(".inin"):
                # Intentar formatear JSON
                try:
                    data = json.loads(raw_content)
                    
                    # Generar vista legible
                    text_preview = f"# Archivo: {original_name}\n\n"
                    for block in data:
                        b_type = block.get("type", "unknown")
                        b_content = block.get("content", "")
                        
                        if b_type == "header":
                            text_preview += f"# {b_content}\n\n"
                        elif b_type == "text":
                            text_preview += f"{b_content}\n"
                        elif b_type == "properties":
                            text_preview += "[Propiedades]\n"
                    
                    content = text_preview
                except:
                    content = raw_content
            else:
                content = raw_content
                
            self.preview_text.setText(content)
        except Exception as e:
            self.preview_text.setText(f"No se pudo leer el archivo: {e}")

    def restore_selected(self):
        items = self.list_widget.selectedItems()
        if not items:
            return
            
        for item in items:
            unique_name = item.data(Qt.ItemDataRole.UserRole)
            self.project.restore_from_trash(unique_name)
            
        self.load_items()
        self.preview_text.clear()
        QMessageBox.information(self, "Restaurado", f"{len(items)} elemento(s) restaurado(s).")

    def delete_permanently(self):
        items = self.list_widget.selectedItems()
        if not items:
            return
            
        reply = QMessageBox.question(
            self, "Eliminar Permanentemente", 
            f"¿Estás seguro de que quieres eliminar {len(items)} elemento(s) para siempre?\nEsta acción NO se puede deshacer.",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        
        if reply == QMessageBox.StandardButton.Yes:
            for item in items:
                unique_name = item.data(Qt.ItemDataRole.UserRole)
                self.project.delete_from_trash(unique_name)
            
            self.load_items()
            self.preview_text.clear()

    def empty_trash(self):
        reply = QMessageBox.question(
            self, "Confirmar", 
            "¿Estás seguro de que quieres vaciar la papelera? Esta acción no se puede deshacer.",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        
        if reply == QMessageBox.StandardButton.Yes:
            self.project.empty_trash()
            self.load_items()
            self.preview_text.clear()
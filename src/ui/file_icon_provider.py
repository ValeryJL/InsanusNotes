"""Proveedor de iconos personalizado para archivos"""

from PyQt6.QtWidgets import QFileIconProvider
from PyQt6.QtCore import QFileInfo
from PyQt6.QtGui import QIcon, QPixmap, QPainter, QColor, QFont
from pathlib import Path


class CustomFileIconProvider(QFileIconProvider):
    """Proveedor de iconos que muestra emojis/símbolos según extensión"""
    
    def __init__(self):
        super().__init__()
        
        # Mapeo de extensiones a emojis
        self.extension_icons = {
            '.mdin': '📝',   # Nota markdown
            '.inin': '🧩',   # Interfaz
            '.csvin': '📊',  # Tabla de datos
            '.md': '📄',     # Markdown genérico
        }
    
    def icon(self, info):
        """Retorna icono personalizado según tipo de archivo"""
        if isinstance(info, QFileInfo):
            file_info = info
        else:
            # Es un tipo (Folder, File, etc)
            return super().icon(info)
        
        # Si es directorio, usar icono por defecto
        if file_info.isDir():
            return super().icon(file_info)
        
        # Obtener extensión
        file_path = Path(file_info.filePath())
        ext = file_path.suffix.lower()
        
        # Si tenemos emoji para esta extensión, crear icono
        if ext in self.extension_icons:
            emoji = self.extension_icons[ext]
            return self._create_emoji_icon(emoji)
        
        # Icono por defecto
        return super().icon(file_info)
    
    def _create_emoji_icon(self, emoji: str, size: int = 32) -> QIcon:
        """Crea un QIcon a partir de un emoji/texto"""
        pixmap = QPixmap(size, size)
        pixmap.fill(QColor(0, 0, 0, 0))  # Transparente
        
        painter = QPainter(pixmap)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        
        # Configurar fuente grande para emoji
        font = QFont()
        font.setPointSize(int(size * 0.6))
        painter.setFont(font)
        
        # Dibujar emoji centrado
        painter.drawText(pixmap.rect(), int(0x0004 | 0x0080), emoji)  # AlignCenter | TextDontClip
        painter.end()
        
        return QIcon(pixmap)

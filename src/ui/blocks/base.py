"""
Clases base para todos los bloques del editor.

Este módulo define las clases fundamentales que todos los bloques del editor
heredan, incluyendo señales de comunicación y comportamientos base.
"""

from __future__ import annotations

from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QMouseEvent
from PyQt6.QtWidgets import QWidget, QVBoxLayout, QTextBrowser


class BaseBlock(QWidget):
    """
    Clase base común para todos los bloques del editor.
    
    Todos los bloques del editor (texto, tabla, encabezado, etc.) heredan de esta clase.
    Proporciona señales estándar para comunicación y un layout básico.
    
    Signals:
        got_focus: Emitida cuando el bloque obtiene el foco (parámetro: self)
        content_changed: Emitida cuando el contenido del bloque cambia
        split_requested: Solicitud de dividir el bloque (parámetros: self, texto)
        delete_requested: Solicitud de eliminar el bloque (parámetro: self)
    """

    got_focus = pyqtSignal(object)
    content_changed = pyqtSignal()
    split_requested = pyqtSignal(object, str)
    delete_requested = pyqtSignal(object)

    def __init__(self):
        """Inicializa el bloque base con layout estándar."""
        super().__init__()
        self.setAttribute(Qt.WidgetAttribute.WA_StyledBackground, True)
        self.layout = QVBoxLayout(self)
        self.layout.setContentsMargins(8, 4, 8, 4)
        self.layout.setSpacing(4)


class ClickablePreview(QTextBrowser):
    """
    QTextBrowser que emite señales personalizadas para clicks y links.
    
    Extiende QTextBrowser para permitir detectar clicks en el área de texto
    y en enlaces internos de manera separada.
    
    Signals:
        clicked: Emitida cuando se hace click en el área (no en un link)
        link_clicked: Emitida cuando se hace click en un link (parámetros: href, pos)
    """

    clicked = pyqtSignal()
    link_clicked = pyqtSignal(str, object)

    def mousePressEvent(self, event: QMouseEvent):
        """
        Maneja eventos de click del mouse.
        
        Args:
            event: Evento del mouse
            
        Note:
            Distingue entre clicks en links y clicks en el área general.
        """
        try:
            pos = event.position().toPoint()
        except Exception:
            pos = event.pos()
        href = self.anchorAt(pos)
        if href:
            self.link_clicked.emit(href, pos)
        else:
            self.clicked.emit()
        super().mousePressEvent(event)

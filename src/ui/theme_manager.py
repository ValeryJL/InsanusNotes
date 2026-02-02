"""
Gestor de temas para la interfaz de InsanusNotes.

Este módulo gestiona la carga y aplicación de temas visuales mediante
hojas de estilo QSS (Qt Style Sheets) dinámicas de forma multiplataforma.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Optional

from utils.platform_utils import UITheme, Platform
from utils.config_manager import get_config_manager

logger = logging.getLogger(__name__)

class ThemeManager:
    """
    Gestiona la apariencia visual de la aplicación mediante QSS dinámico.
    
    Lee temas desde un archivo JSON y genera estilos QSS personalizados
    para todos los componentes de la interfaz.
    
    Attributes:
        themes_path: Ruta al archivo de definición de temas
        themes: Diccionario con todos los temas disponibles
        current_theme_id: ID del tema actualmente activo
    """
    
    def __init__(self):
        """Inicializa el gestor de temas con detección automática del SO."""
        self.themes_path = Path(__file__).parent / "themes.json"
        self.themes = self._load_themes()
        self.config_manager = get_config_manager()
        
        # Detectar tema recomendado según SO
        recommended_theme = UITheme.get_recommended_theme()
        self.current_theme_id = self.config_manager.get("theme", recommended_theme)
        
        logger.info(f"Tema seleccionado: {self.current_theme_id} (SO: {Platform.get_name()})")
    
    def _load_themes(self) -> Dict:
        """
        Carga los temas desde el archivo JSON de forma segura.
        
        Returns:
            Diccionario con las definiciones de temas
        """
        try:
            if self.themes_path.exists():
                with open(self.themes_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            logger.error(f"Error al cargar temas: {e}")
        
        return {}
    
    def get_theme(self, theme_id: str) -> Optional[Dict]:
        """
        Obtiene la definición de un tema específico.
        
        Args:
            theme_id: Identificador del tema
            
        Returns:
            Diccionario con la definición del tema, o None si no existe
        """
        return self.themes.get(theme_id)
    
    def get_current_theme(self) -> Dict:
        """
        Obtiene el tema actualmente seleccionado.
        
        Returns:
            Diccionario con la definición del tema actual
            
        Note:
            Si el tema actual no existe, retorna el tema oscuro por defecto.
        """
        theme = self.themes.get(self.current_theme_id)
        if not theme:
            theme = self.themes.get("insanus_dark", {})
        return theme if theme else {}

    def set_theme(self, theme_id: str):
        """
        Establece el tema activo y guarda en configuración.
        
        Args:
            theme_id: Identificador del tema a activar
            
        Note:
            Solo establece el tema si existe en la lista de temas disponibles.
            La selección se guarda en la configuración de usuario.
        """
        if theme_id in self.themes:
            self.current_theme_id = theme_id
            self.config_manager.set("theme", theme_id)
            self.config_manager.save()
            logger.info(f"Tema cambiado a: {theme_id}")

    def generate_qss(self) -> str:
        """
        Genera el estilo QSS completo basado en el tema actual.
        
        Returns:
            String con el código QSS para aplicar a la aplicación
            
        Note:
            Esta función genera CSS personalizado para todos los widgets
            de la aplicación, incluyendo ventanas, menús, bloques, etc.
        """
        theme = self.get_current_theme()
        c = theme["colors"]
        
        # Plantilla QSS base
        qss = f"""
        QMainWindow, QDialog {{
            background-color: {c['background_primary']};
            color: {c['text_main']};
        }}
        
        QWidget {{
            color: {c['text_main']};
            font-family: 'Inter', 'Segoe UI', sans-serif;
        }}
        
        QSplitter::handle {{
            background-color: {c['border']};
        }}
        
        /* Sidebar / Explorer */
        QTreeView {{
            background-color: {c['background_sidebar']};
            border: none;
            border-right: 1px solid {c['border']};
            color: {c['text_main']};
            outline: none;
        }}
        
        QTreeView::item {{
            padding: 4px;
        }}
        
        QTreeView::item:hover {{
            background-color: {c['block_hover']};
        }}
        
        QTreeView::item:selected {{
            background-color: {c['accent']};
            color: white;
        }}

        /* Sidebar Header */
        #SidebarHeader {{
            border-bottom: 1px solid {c['border']};
            background-color: {c['background_sidebar']};
        }}

        #SidebarProjectName {{
            color: {c['text_main']};
            font-weight: bold;
            font-size: 12px;
            letter-spacing: 1px;
        }}

        /* Botón de añadir item (+) */
        QPushButton#BtnAddItem {{
            border: none;
            border-radius: 4px;
            background-color: transparent;
            color: {c['text_main']};
            font-weight: bold;
            font-size: 18px;
        }}

        QPushButton#BtnAddItem:hover {{
            background-color: {c['block_hover']};
            color: {c['accent']};
        }}

        /* Menú Bar */
        QMenuBar {{
            background-color: {c['background_primary']};
            border-bottom: 1px solid {c['border']};
            color: {c['text_main']};
        }}
        
        QMenuBar::item {{
            background-color: transparent;
            padding: 5px 10px;
        }}
        
        QMenuBar::item:selected {{
            background-color: {c['block_hover']};
            border-radius: 4px;
        }}

        /* Menús */
        QMenu {{
            background-color: {c['background_secondary']};
            border: 1px solid {c['border']};
            padding: 5px;
            border-radius: 4px;
            color: {c['text_main']};
        }}
        
        QMenu::item {{
            padding: 5px 20px;
            border-radius: 4px;
        }}
        
        QMenu::item:selected {{
            background-color: {c['accent']};
            color: white;
        }}
        
        QMenu::separator {{
            height: 1px;
            background: {c['border']};
            margin: 5px 0px;
        }}

        /* Status Bar */
        QStatusBar {{
            background-color: {c['background_sidebar']};
            color: {c['text_muted']};
            border-top: 1px solid {c['border']};
        }}
        
        /* Editor Area */
        QScrollArea {{
            background-color: {c['background_primary']};
            border: none;
        }}
        
        #EditorCanvas {{
            background-color: {c['background_primary']};
        }}
        
        #EditorCenteringWidget {{
            background-color: {c['background_primary']};
        }}
        
        /* Bloques */
        QLineEdit#TitleBlock {{
            font-size: 32px;
            font-weight: bold;
            background: transparent;
            border: none;
            padding: 10px 0px;
            color: {c['text_main']};
        }}
        
        #PropertiesPanel {{
            background-color: transparent;
            margin: 10px 0px;
        }}
        
        /* Inputs genéricos */
        QLineEdit, QTextEdit {{
            background-color: transparent;
            border: 1px solid transparent;
            selection-background-color: {c['accent']};
            color: {c['text_main']};
        }}

        /* Properties Block Specifics */
        QPushButton#PropToggleButton {{
            text-align: left;
            font-weight: bold;
            color: {c['text_muted']};
            font-size: 10px;
            letter-spacing: 1px;
            border: none;
            background: transparent;
        }}
        QPushButton#PropToggleButton:hover {{ color: {c['text_main']}; }}

        QLineEdit#PropKey {{
            color: {c['text_muted']};
            background-color: {c['background_secondary']};
            border: 1px solid {c['border']};
            border-radius: 4px;
            padding: 4px 6px;
            color: {c['text_main']};
        }}
        
        QLineEdit#PropValue {{
            color: {c['text_main']};
            background-color: {c['background_secondary']};
            border: 1px solid {c['border']};
            border-radius: 4px;
            padding: 4px 6px;
        }}

        QPushButton#PropAddButton {{
            border: none;
            color: {c['text_main']};
            font-weight: bold;
            font-size: 16px;
            background: transparent;
        }}
        QPushButton#PropAddButton:hover {{
            color: {c['accent']};
            background: {c['block_hover']};
            border-radius: 3px;
        }}

        QPushButton#PropDelButton {{
            border: none;
            color: {c['text_main']};
            font-weight: bold;
            font-size: 16px;
            background: transparent;
        }}
        QPushButton#PropDelButton:hover {{ color: #dc3545; }}

        /* Separadores entre columnas en filas de propiedades/items */
        QFrame#ItemSeparator {{
            background-color: {c['border']};
            min-width: 1px;
            max-width: 1px;
            margin: 0 8px;
        }}

        /* Botones pequeños usados dentro de filas */
        QPushButton#SmallButton {{
            background-color: transparent;
            border: 1px solid transparent;
            color: {c['text_muted']};
            font-weight: bold;
            font-size: 12px;
            min-width: 24px;
            min-height: 24px;
            border-radius: 4px;
        }}
        QPushButton#SmallButton:hover {{
            color: {c['text_main']};
            background-color: {c['block_hover']};
            border-color: rgba(255,255,255,0.03);
        }}

        /* Toggle específico para arreglos: color según estado expandido */
        QPushButton#SmallToggle {{
            color: {c['text_main']};
            background-color: transparent;
            border: 1px solid rgba(255,255,255,0.02);
            border-radius: 4px;
            padding: 2px;
        }}
        QPushButton#SmallToggle[expanded="true"] {{
            color: {c['accent']};
            background-color: {c['block_hover']};
        }}
        QPushButton#SmallToggle[expanded="false"] {{
            color: {c['text_muted']};
            background-color: transparent;
        }}
        QPushButton#SmallToggle:hover {{
            color: {c['text_main']};
            background-color: {c['block_hover']};
        }}

        /* Estilo para los selectores de tipo en filas (PropType) */
        QComboBox#PropType {{
            color: {c['text_muted']};
            background-color: transparent;
            border: none;
            font-size: 10px;
            padding: 2px 4px;
        }}
        QComboBox#PropType::drop-down {{
            subcontrol-origin: padding;
            subcontrol-position: top right;
            width: 18px;
            border: none;
            background: transparent;
        }}
        QComboBox#PropType QAbstractItemView {{
            background-color: {c['background_secondary']};
            color: {c['text_main']};
            selection-background-color: {c['accent']};
        }}

        
        /* Botones */
        QPushButton {{
            background-color: qlineargradient(spread:pad, x1:0, y1:0, x2:0, y2:1, stop:0 rgba(255,255,255,0.02), stop:1 {c['background_secondary']});
            border: 1px solid {c['border']};
            border-radius: 6px;
            padding: 5px 12px;
            color: {c['text_main']};
            font-family: 'Inter', 'Segoe UI', 'Noto Color Emoji', 'Segoe UI Emoji', sans-serif;
        }}

        QPushButton:hover {{
            background-color: qlineargradient(spread:pad, x1:0, y1:0, x2:0, y2:1, stop:0 rgba(255,255,255,0.03), stop:1 {c['block_hover']});
            border-color: {c['accent']};
        }}

        QPushButton:pressed {{
            background-color: qlineargradient(spread:pad, x1:0, y1:0, x2:0, y2:1, stop:0 rgba(0,0,0,0.04), stop:1 {c['background_secondary']});
            margin-top: 1px;
        }}
        
        QScrollBar:vertical {{
            border: none;
            background: {c['background_primary']};
            width: 10px;
            margin: 0px;
        }}
        
        QScrollBar::handle:vertical {{
            background: {c['border']};
            min-height: 20px;
            border-radius: 5px;
        }}
        
        QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{
            height: 0px;
        }}
        """
        return qss

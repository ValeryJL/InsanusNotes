#!/usr/bin/env python3
"""
InsanusNotes - Editor de notas tipo Notion
Versión multiplataforma (Windows, macOS, Linux)
"""

import sys
import os
import logging
from pathlib import Path

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Añadir directorio src al path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from utils.platform_utils import Platform
from utils.platform_paths import PlatformPaths

logger.info(f"InsanusNotes iniciando en {Platform.get_name()} {Platform.get_version()}")
logger.info(f"Python {Platform.get_python_version()}")

from ui.main_window import MainWindow
from core.project_manager import ProjectManager
from utils.config_manager import get_config_manager


def check_dependencies() -> bool:
    """
    Verifica que todas las dependencias estén disponibles.
    
    Returns:
        bool: True si todas las dependencias están ok, False si hay problemas
    """
    try:
        import importlib.metadata
        
        # Verificar PyQt6
        try:
            import PyQt6
            version = importlib.metadata.version('PyQt6')
            logger.info(f"PyQt6 {version} ✓")
        except Exception:
            logger.info("PyQt6 ✓")
        
        # Verificar markdown
        try:
            import markdown
            version = importlib.metadata.version('markdown')
            logger.info(f"markdown {version} ✓")
        except Exception:
            logger.info("markdown ✓")
        
        # Verificar platformdirs
        try:
            import platformdirs
            version = importlib.metadata.version('platformdirs')
            logger.info(f"platformdirs {version} ✓")
        except Exception:
            logger.info("platformdirs ✓")
        
        return True
        
    except ImportError as e:
        logger.error(f"Dependencia faltante: {e}")
        return False


def ensure_data_directories() -> bool:
    """
    Asegura que existan los directorios de datos de la aplicación.
    
    Returns:
        bool: True si se crearon/existen los directorios correctamente
    """
    try:
        PlatformPaths.get_config_dir()
        PlatformPaths.get_data_dir()
        PlatformPaths.get_cache_dir()
        logger.info(f"Directorios de datos configurados en {PlatformPaths.get_data_dir()}")
        return True
    except Exception as e:
        logger.error(f"Error al crear directorios de datos: {e}")
        return False


def main():
    """Punto de entrada principal de la aplicación."""
    app = None
    
    try:
        # Verificar dependencias
        if not check_dependencies():
            logger.error("❌ Faltan dependencias. Ejecuta: pip install -r requirements.txt")
            return 1
        
        # Asegurar directorios de datos
        if not ensure_data_directories():
            logger.error("❌ No se pueden crear directorios de datos")
            return 1
        
        # Importar PyQt6
        from PyQt6.QtWidgets import QApplication
        from PyQt6.QtCore import Qt
        
        app = QApplication(sys.argv)
        app.setApplicationName("InsanusNotes")
        app.setApplicationVersion("2.0.0")
        
        # Configuración de la aplicación
        app.setStyle("Fusion")
        
        # Crear gestor de configuración
        config_manager = get_config_manager()
        
        # Crear gestor de proyectos
        project_manager = ProjectManager()
        
        # Crear ventana principal
        main_window = MainWindow(project_manager)
        main_window.show()
        
        logger.info("Aplicación iniciada correctamente")
        return app.exec()
        
    except ImportError as e:
        logger.error(f"❌ Error de importación: {e}")
        logger.error("Ejecuta: pip install -r requirements.txt")
        return 1
    except Exception as e:
        logger.error(f"❌ Error al iniciar: {e}", exc_info=True)
        return 1
    finally:
        if app:
            logger.info("Aplicación cerrada")


if __name__ == "__main__":
    sys.exit(main())
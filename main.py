#!/usr/bin/env python3
"""
InsanusNotes - Versión Python nativa para Linux
Editor de notas tipo Notion con comandos slash y referencias
"""

import sys
import os
from pathlib import Path

# Añadir directorio src al path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from ui.main_window import MainWindow
from core.project_manager import ProjectManager

def main():
    """Punto de entrada principal"""
    app = None
    
    try:
        # Importar PyQt6
        from PyQt6.QtWidgets import QApplication
        from PyQt6.QtCore import Qt
        
        app = QApplication(sys.argv)
        app.setApplicationName("InsanusNotes")
        app.setApplicationVersion("2.0.0")
        
        # Configuración de la aplicación
        app.setStyle("Fusion")
        
        # Crear gestor de proyectos
        project_manager = ProjectManager()
        
        # Crear ventana principal
        main_window = MainWindow(project_manager)
        main_window.show()
        
        return app.exec()
        
    except ImportError as e:
        print("❌ Error: PyQt6 no está instalado")
        print("Ejecuta: pip install PyQt6")
        return 1
    except Exception as e:
        print(f"❌ Error al iniciar: {e}")
        return 1
    finally:
        if app:
            app.quit()

if __name__ == "__main__":
    sys.exit(main())
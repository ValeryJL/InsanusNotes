#!/usr/bin/env python3
"""
Script universal para ejecutar InsanusNotes.

Funciona en Windows, macOS y Linux.
Verifica dependencias e instala si es necesario.
"""

import sys
import subprocess
from pathlib import Path


def check_python_version():
    """Verifica que se está usando Python 3.8+"""
    if sys.version_info < (3, 8):
        print(f"❌ Error: Se requiere Python 3.8 o superior")
        print(f"   Versión actual: {sys.version}")
        sys.exit(1)
    print(f"✓ Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")


def check_and_install_dependencies():
    """Verifica e instala dependencias si es necesario."""
    requirements_file = Path(__file__).parent / "requirements.txt"
    
    if not requirements_file.exists():
        print(f"❌ No se encontró {requirements_file}")
        sys.exit(1)
    
    print("\nVerificando dependencias...")
    
    try:
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", "-r", str(requirements_file)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        print("✓ Dependencias instaladas/actualizadas")
    except subprocess.CalledProcessError:
        print("❌ Error al instalar dependencias")
        print(f"   Intenta manualmente: python -m pip install -r requirements.txt")
        sys.exit(1)


def main():
    """Punto de entrada principal."""
    print("🚀 InsanusNotes Launcher")
    print("-" * 40)
    
    check_python_version()
    check_and_install_dependencies()
    
    print("\n▶ Iniciando aplicación...")
    
    # Ejecutar main.py
    main_script = Path(__file__).parent / "main.py"
    try:
        subprocess.run(
            [sys.executable, str(main_script)],
            check=False
        )
    except KeyboardInterrupt:
        print("\n\n⏹ Aplicación cerrada por el usuario")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Error al ejecutar: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

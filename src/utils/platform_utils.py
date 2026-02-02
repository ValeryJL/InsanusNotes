"""
Utilidades de detección y compatibilidad multiplataforma.

Este módulo proporciona funciones para detectar características del SO
y adaptar comportamientos según la plataforma.
"""

import sys
import platform as _platform_module
from typing import Literal, Dict, Any


class Platform:
    """Información y detección del sistema operativo."""
    
    @staticmethod
    def is_windows() -> bool:
        """Detecta si está ejecutando en Windows."""
        return sys.platform == "win32"
    
    @staticmethod
    def is_macos() -> bool:
        """Detecta si está ejecutando en macOS."""
        return sys.platform == "darwin"
    
    @staticmethod
    def is_linux() -> bool:
        """Detecta si está ejecutando en Linux."""
        return sys.platform == "linux"
    
    @staticmethod
    def get_name() -> Literal["Windows", "macOS", "Linux", "Unknown"]:
        """
        Obtiene el nombre legible del SO.
        
        Returns:
            str: "Windows", "macOS", "Linux" o "Unknown"
        """
        if Platform.is_windows():
            return "Windows"
        elif Platform.is_macos():
            return "macOS"
        elif Platform.is_linux():
            return "Linux"
        return "Unknown"
    
    @staticmethod
    def get_version() -> str:
        """
        Obtiene la versión del SO.
        
        Returns:
            str: Versión del SO
        """
        return _platform_module.platform()
    
    @staticmethod
    def get_architecture() -> Literal["x86_64", "x86", "arm64", "arm", "Unknown"]:
        """
        Obtiene la arquitectura del procesador.
        
        Returns:
            str: "x86_64", "x86", "arm64", "arm" o "Unknown"
        """
        machine = _platform_module.machine().lower()
        
        if machine in ("amd64", "x86_64"):
            return "x86_64"
        elif machine in ("i386", "i686", "x86"):
            return "x86"
        elif machine in ("aarch64", "arm64"):
            return "arm64"
        elif machine.startswith("arm"):
            return "arm"
        
        return "Unknown"
    
    @staticmethod
    def get_python_version() -> str:
        """
        Obtiene la versión de Python.
        
        Returns:
            str: Versión de Python
        """
        return f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"


class Shortcuts:
    """Gestión de atajos de teclado multiplataforma."""
    
    @staticmethod
    def get_modifier() -> str:
        """
        Obtiene el modificador principal según SO.
        
        Returns:
            str: "Ctrl" en Windows/Linux, "Cmd" en macOS
        """
        if Platform.is_macos():
            return "Cmd"
        return "Ctrl"
    
    @staticmethod
    def get_alt() -> str:
        """
        Obtiene la tecla Alt según SO.
        
        Returns:
            str: "Alt" en Windows/Linux, "Option" en macOS
        """
        if Platform.is_macos():
            return "Option"
        return "Alt"
    
    @staticmethod
    def get_shortcut_string(shortcut: str) -> str:
        """
        Convierte un string de atajo a formato del SO.
        
        Args:
            shortcut: Formato estándar "Ctrl+S", "Cmd+Z", etc.
            
        Returns:
            str: Formato según SO actual
            
        Example:
            >>> Shortcuts.get_shortcut_string("Ctrl+S")
            "Cmd+S" en macOS, "Ctrl+S" en Windows/Linux
        """
        if Platform.is_macos():
            shortcut = shortcut.replace("Ctrl+", "Cmd+")
            shortcut = shortcut.replace("Alt+", "Option+")
        else:
            shortcut = shortcut.replace("Cmd+", "Ctrl+")
            shortcut = shortcut.replace("Option+", "Alt+")
        
        return shortcut


class UITheme:
    """Configuración de tema UI según plataforma."""
    
    @staticmethod
    def get_system_theme_config() -> Dict[str, Any]:
        """
        Obtiene configuración de tema recomendada para el SO.
        
        Returns:
            Dict: Configuración de tema específica del SO
        """
        config: Dict[str, Any] = {
            "base_font": "Arial",
            "monospace_font": "Courier New",
            "supports_native_dark_mode": False,
            "prefers_dark_mode": False,
            "use_system_colors": True,
        }
        
        if Platform.is_windows():
            config.update({
                "base_font": "Segoe UI, sans-serif",
                "monospace_font": "Consolas, monospace",
                "supports_native_dark_mode": True,
                "prefers_dark_mode": _get_windows_dark_mode(),
            })
        elif Platform.is_macos():
            config.update({
                "base_font": "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                "monospace_font": "Monaco, Menlo, monospace",
                "supports_native_dark_mode": True,
                "prefers_dark_mode": _get_macos_dark_mode(),
            })
        elif Platform.is_linux():
            config.update({
                "base_font": "Ubuntu, Noto Sans, sans-serif",
                "monospace_font": "Ubuntu Mono, Noto Mono, monospace",
                "supports_native_dark_mode": True,
            })
        
        return config
    
    @staticmethod
    def get_recommended_theme() -> str:
        """
        Obtiene el tema recomendado para el SO.
        
        Returns:
            str: Nombre del tema recomendado
        """
        config = UITheme.get_system_theme_config()
        if config.get("prefers_dark_mode"):
            return "dark"
        return "light"


def _get_windows_dark_mode() -> bool:
    """
    Detecta si Windows está en modo oscuro.
    
    Returns:
        bool: True si Windows usa tema oscuro
    """
    if not Platform.is_windows():
        return False
    
    try:
        import winreg
        registry_path = r"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize"
        registry_key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, registry_path)
        value, _ = winreg.QueryValueEx(registry_key, "AppsUseLightTheme")
        winreg.CloseKey(registry_key)
        return value == 0  # 0 = modo oscuro, 1 = modo claro
    except Exception:
        return False


def _get_macos_dark_mode() -> bool:
    """
    Detecta si macOS está en modo oscuro.
    
    Returns:
        bool: True si macOS usa tema oscuro
    """
    if not Platform.is_macos():
        return False
    
    try:
        import subprocess
        result = subprocess.run(
            ["defaults", "read", "-g", "AppleInterfaceStyle"],
            capture_output=True,
            text=True
        )
        return "Dark" in result.stdout
    except Exception:
        return False


# Exports
__all__ = ["Platform", "Shortcuts", "UITheme"]

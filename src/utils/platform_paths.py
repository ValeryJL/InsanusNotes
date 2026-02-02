"""
Gestión multiplataforma de rutas y directorios.

Este módulo proporciona funciones para obtener directorios estándar del sistema
operativo de manera agnóstica, asegurando que la aplicación funcione correctamente
en Windows, macOS y Linux.
"""

import sys
import platform
from pathlib import Path
from typing import Optional

try:
    import platformdirs
    HAS_PLATFORMDIRS = True
except ImportError:
    HAS_PLATFORMDIRS = False
    try:
        import appdirs
        HAS_APPDIRS = True
    except ImportError:
        HAS_APPDIRS = False


class PlatformPaths:
    """
    Gestión centralizada de rutas multiplataforma.
    
    Proporciona métodos para obtener directorios estándar según el SO:
    - Configuración de aplicación
    - Datos de usuario
    - Cache
    - Temporal
    
    Attributes:
        APP_NAME: Nombre de la aplicación
        APP_AUTHOR: Autor/Compañía de la aplicación
    """
    
    APP_NAME = "InsanusNotes"
    APP_AUTHOR = "ValeryJL"
    
    @staticmethod
    def get_config_dir() -> Path:
        r"""
        Obtiene el directorio de configuración de la aplicación.
        
        Returns:
            Path: Directorio de configuración según el SO
            - Windows: %APPDATA%\InsanusNotes
            - macOS: ~/Library/Application Support/InsanusNotes
            - Linux: ~/.config/InsanusNotes
        """
        if HAS_PLATFORMDIRS:
            return Path(platformdirs.user_config_dir(
                PlatformPaths.APP_NAME,
                PlatformPaths.APP_AUTHOR,
                ensure_exists=True
            ))
        elif HAS_APPDIRS:
            return Path(appdirs.user_config_dir(
                PlatformPaths.APP_NAME,
                PlatformPaths.APP_AUTHOR
            ))
        else:
            # Fallback manual si no hay las librerías
            if sys.platform == "win32":
                base = Path(os.environ.get("APPDATA", str(Path.home())))
            elif sys.platform == "darwin":
                base = Path.home() / "Library" / "Application Support"
            else:  # Linux y otros
                base = Path.home() / ".config"
            
            config_dir = base / PlatformPaths.APP_NAME
            config_dir.mkdir(parents=True, exist_ok=True)
            return config_dir
    
    @staticmethod
    def get_data_dir() -> Path:
        r"""
        Obtiene el directorio de datos de usuario.
        
        Returns:
            Path: Directorio de datos según el SO
            - Windows: %APPDATA%\InsanusNotes\data
            - macOS: ~/Library/Application Support/InsanusNotes/data
            - Linux: ~/.local/share/InsanusNotes
        """
        if HAS_PLATFORMDIRS:
            return Path(platformdirs.user_data_dir(
                PlatformPaths.APP_NAME,
                PlatformPaths.APP_AUTHOR,
                ensure_exists=True
            ))
        elif HAS_APPDIRS:
            return Path(appdirs.user_data_dir(
                PlatformPaths.APP_NAME,
                PlatformPaths.APP_AUTHOR
            ))
        else:
            # Fallback manual
            if sys.platform == "win32":
                base = Path(os.environ.get("APPDATA", str(Path.home())))
                data_dir = base / PlatformPaths.APP_NAME / "data"
            elif sys.platform == "darwin":
                data_dir = Path.home() / "Library" / "Application Support" / PlatformPaths.APP_NAME / "data"
            else:  # Linux
                base = Path(os.environ.get("XDG_DATA_HOME", str(Path.home() / ".local" / "share")))
                data_dir = base / PlatformPaths.APP_NAME
            
            data_dir.mkdir(parents=True, exist_ok=True)
            return data_dir
    
    @staticmethod
    def get_cache_dir() -> Path:
        r"""
        Obtiene el directorio de cache.
        
        Returns:
            Path: Directorio de cache según el SO
            - Windows: %LOCALAPPDATA%\InsanusNotes\cache
            - macOS: ~/Library/Caches/InsanusNotes
            - Linux: ~/.cache/InsanusNotes
        """
        if HAS_PLATFORMDIRS:
            return Path(platformdirs.user_cache_dir(
                PlatformPaths.APP_NAME,
                PlatformPaths.APP_AUTHOR,
                ensure_exists=True
            ))
        elif HAS_APPDIRS:
            return Path(appdirs.user_cache_dir(
                PlatformPaths.APP_NAME,
                PlatformPaths.APP_AUTHOR
            ))
        else:
            # Fallback manual
            if sys.platform == "win32":
                base = Path(os.environ.get("LOCALAPPDATA", str(Path.home())))
                cache_dir = base / PlatformPaths.APP_NAME / "cache"
            elif sys.platform == "darwin":
                cache_dir = Path.home() / "Library" / "Caches" / PlatformPaths.APP_NAME
            else:  # Linux
                base = Path(os.environ.get("XDG_CACHE_HOME", str(Path.home() / ".cache")))
                cache_dir = base / PlatformPaths.APP_NAME
            
            cache_dir.mkdir(parents=True, exist_ok=True)
            return cache_dir
    
    @staticmethod
    def get_temp_dir() -> Path:
        """
        Obtiene el directorio temporal.
        
        Returns:
            Path: Directorio temporal para archivos temporales
        """
        import tempfile
        temp_dir = Path(tempfile.gettempdir()) / PlatformPaths.APP_NAME
        temp_dir.mkdir(parents=True, exist_ok=True)
        return temp_dir
    
    @staticmethod
    def get_projects_dir() -> Path:
        r"""
        Obtiene el directorio por defecto para proyectos.
        
        Returns:
            Path: Directorio de proyectos
            - Windows: %USERPROFILE%\Documents\InsanusNotes
            - macOS: ~/Documents/InsanusNotes
            - Linux: ~/Documents/InsanusNotes
        """
        if sys.platform == "win32":
            # En Windows, usar My Documents
            documents = Path.home() / "Documents"
        else:
            # En macOS y Linux
            documents = Path.home() / "Documents"
        
        projects_dir = documents / PlatformPaths.APP_NAME
        projects_dir.mkdir(parents=True, exist_ok=True)
        return projects_dir
    
    @staticmethod
    def normalize_path(path: Path) -> Path:
        """
        Normaliza una ruta para la plataforma actual.
        
        Resuelve separadores de ruta, símbolos ~, etc.
        
        Args:
            path: Ruta a normalizar
            
        Returns:
            Path: Ruta normalizada y resuelta
        """
        return path.expanduser().resolve()
    
    @staticmethod
    def is_path_within(child: Path, parent: Path) -> bool:
        """
        Verifica si una ruta está dentro de otra.
        
        Args:
            child: Ruta potencialmente dentro
            parent: Ruta padre
            
        Returns:
            bool: True si child está dentro de parent
        """
        try:
            child.relative_to(parent)
            return True
        except ValueError:
            return False
    
    @staticmethod
    def get_recents_file() -> Path:
        """
        Obtiene la ruta del archivo de proyectos recientes.
        
        Returns:
            Path: Ruta a {config_dir}/recent_projects.json
        """
        return PlatformPaths.get_config_dir() / "recent_projects.json"
    
    @staticmethod
    def get_config_file() -> Path:
        """
        Obtiene la ruta del archivo de configuración global.
        
        Returns:
            Path: Ruta a {config_dir}/config.json
        """
        return PlatformPaths.get_config_dir() / "config.json"


import os

# Exportar como singleton para fácil acceso
paths = PlatformPaths()

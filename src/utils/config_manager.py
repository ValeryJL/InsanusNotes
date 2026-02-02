"""
Gestor de configuración global de InsanusNotes.

Este módulo gestiona la configuración de usuario, preferencias y configuración
de la aplicación de forma multiplataforma.
"""

import logging
from pathlib import Path
from typing import Any, Dict, Optional

from utils.json_io import read_json, write_json_atomic
from utils.platform_paths import PlatformPaths

logger = logging.getLogger(__name__)


class ConfigManager:
    """
    Gestor centralizado de configuración global de la aplicación.
    
    Maneja:
    - Configuración de usuario (temas, tamaño de ventana, etc.)
    - Proyectos recientes
    - Preferencias globales
    - Persistencia en directorios estándar del SO
    """
    
    # Configuración por defecto
    DEFAULT_CONFIG = {
        "version": "2.0.0",
        "theme": "auto",  # "light", "dark", "auto"
        "window_width": 1200,
        "window_height": 800,
        "window_maximized": False,
        "last_project": None,
        "auto_save_enabled": True,
        "auto_save_interval": 5000,  # ms
        "trash_retention_days": 30,
    }
    
    def __init__(self):
        """Inicializa el gestor de configuración."""
        self.config_path = PlatformPaths.get_config_file()
        self.recents_path = PlatformPaths.get_recents_file()
        self._config: Dict[str, Any] = self._load_config()
        self._recents: list = self._load_recents()
    
    def _load_config(self) -> Dict[str, Any]:
        """
        Carga la configuración desde archivo.
        
        Returns:
            Dict: Configuración cargada o configuración por defecto
        """
        config = read_json(self.config_path, {})
        
        # Fusionar con valores por defecto
        merged = self.DEFAULT_CONFIG.copy()
        merged.update(config)
        
        return merged
    
    def _load_recents(self) -> list:
        """
        Carga la lista de proyectos recientes.
        
        Returns:
            list: Lista de rutas a proyectos recientes
        """
        recents = read_json(self.recents_path, [])
        if not isinstance(recents, list):
            recents = []
        return recents
    
    def save(self) -> None:
        """
        Guarda la configuración actual a archivo.
        
        Usa escritura atómica para prevenir corrupción de datos.
        """
        try:
            write_json_atomic(self.config_path, self._config)
            logger.info(f"Configuración guardada en {self.config_path}")
        except Exception as e:
            logger.error(f"Error al guardar configuración: {e}")
    
    def save_recents(self) -> None:
        """
        Guarda la lista de proyectos recientes.
        """
        try:
            write_json_atomic(self.recents_path, self._recents)
        except Exception as e:
            logger.error(f"Error al guardar proyectos recientes: {e}")
    
    # Getters
    def get(self, key: str, default: Any = None) -> Any:
        """
        Obtiene un valor de configuración.
        
        Args:
            key: Clave de configuración (soporta notación de punto: "section.key")
            default: Valor por defecto si no existe la clave
            
        Returns:
            Any: Valor de configuración o default
            
        Example:
            >>> config_manager.get("theme")
            "dark"
            >>> config_manager.get("nonexistent", "default_value")
            "default_value"
        """
        keys = key.split(".")
        value = self._config
        
        for k in keys:
            if isinstance(value, dict):
                value = value.get(k)
                if value is None:
                    return default
            else:
                return default
        
        return value if value is not None else default
    
    def set(self, key: str, value: Any) -> None:
        """
        Establece un valor de configuración.
        
        Args:
            key: Clave de configuración (soporta notación de punto: "section.key")
            value: Valor a establecer
            
        Example:
            >>> config_manager.set("theme", "dark")
        """
        keys = key.split(".")
        
        if len(keys) == 1:
            self._config[key] = value
        else:
            # Navegación anidada
            current = self._config
            for k in keys[:-1]:
                if k not in current:
                    current[k] = {}
                current = current[k]
            current[keys[-1]] = value
    
    # Propiedades comunes
    @property
    def theme(self) -> str:
        """Obtiene el tema actual ('light', 'dark', 'auto')."""
        return self.get("theme", "auto")
    
    @theme.setter
    def theme(self, value: str) -> None:
        """Establece el tema."""
        self.set("theme", value)
    
    @property
    def last_project(self) -> Optional[str]:
        """Obtiene la ruta del último proyecto abierto."""
        return self.get("last_project")
    
    @last_project.setter
    def last_project(self, path: Optional[str]) -> None:
        """Establece el último proyecto abierto."""
        self.set("last_project", path)
    
    @property
    def window_geometry(self) -> tuple:
        """Obtiene geometría de ventana (ancho, alto, maximizado)."""
        return (
            self.get("window_width", 1200),
            self.get("window_height", 800),
            self.get("window_maximized", False),
        )
    
    def set_window_geometry(self, width: int, height: int, maximized: bool = False) -> None:
        """Establece geometría de ventana."""
        self.set("window_width", width)
        self.set("window_height", height)
        self.set("window_maximized", maximized)
    
    @property
    def auto_save_enabled(self) -> bool:
        """Obtiene si auto-guardado está habilitado."""
        return self.get("auto_save_enabled", True)
    
    @auto_save_enabled.setter
    def auto_save_enabled(self, enabled: bool) -> None:
        """Establece si auto-guardado está habilitado."""
        self.set("auto_save_enabled", enabled)
    
    # Recientes
    def add_recent_project(self, project_path: str) -> None:
        """
        Agrega un proyecto a la lista de recientes.
        
        Limita la lista a 10 proyectos más recientes.
        
        Args:
            project_path: Ruta al proyecto
        """
        project_path = str(PlatformPaths.normalize_path(Path(project_path)))
        
        # Remover si ya existe
        if project_path in self._recents:
            self._recents.remove(project_path)
        
        # Agregar al inicio
        self._recents.insert(0, project_path)
        
        # Limitar a 10 recientes
        self._recents = self._recents[:10]
        
        self.save_recents()
    
    def remove_recent_project(self, project_path: str) -> None:
        """
        Remueve un proyecto de recientes.
        
        Args:
            project_path: Ruta al proyecto
        """
        project_path = str(PlatformPaths.normalize_path(Path(project_path)))
        if project_path in self._recents:
            self._recents.remove(project_path)
            self.save_recents()
    
    def get_recent_projects(self) -> list:
        """
        Obtiene lista de proyectos recientes.
        
        Filtra proyectos que ya no existen.
        
        Returns:
            list: Rutas a proyectos recientes que existen
        """
        valid_recents = []
        for project_path in self._recents:
            if Path(project_path).exists():
                valid_recents.append(project_path)
        
        # Actualizar si cambió
        if len(valid_recents) != len(self._recents):
            self._recents = valid_recents
            self.save_recents()
        
        return valid_recents
    
    def clear_recents(self) -> None:
        """Limpia la lista de proyectos recientes."""
        self._recents = []
        self.save_recents()
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Exporta configuración como diccionario.
        
        Returns:
            Dict: Configuración completa
        """
        return self._config.copy()


# Instancia global singleton
_config_manager: Optional[ConfigManager] = None


def get_config_manager() -> ConfigManager:
    """
    Obtiene la instancia global del ConfigManager.
    
    Returns:
        ConfigManager: Instancia global
    """
    global _config_manager
    if _config_manager is None:
        _config_manager = ConfigManager()
    return _config_manager

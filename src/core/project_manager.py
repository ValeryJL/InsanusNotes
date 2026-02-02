"""
Gestor de proyectos y archivos de InsanusNotes.

Este módulo contiene las clases principales para gestionar proyectos, archivos
y el sistema de papelera de la aplicación de forma multiplataforma.
"""

import os
import logging
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

from utils.json_io import read_json, write_json, write_json_atomic
from utils.platform_paths import PlatformPaths
from utils.config_manager import get_config_manager

logger = logging.getLogger(__name__)

class Project:
    """
    Representa un proyecto de InsanusNotes.
    
    Un proyecto es un directorio que contiene notas, interfaces y datos organizados
    en una estructura específica. Incluye configuración, sistema de papelera y
    gestión de archivos.
    
    Attributes:
        path: Ruta al directorio del proyecto
        config_file: Ruta al archivo de configuración del proyecto
        config: Diccionario con la configuración del proyecto
        notes_dir: Directorio para archivos de notas (.mdin)
        interfaces_dir: Directorio para interfaces (.inin)
        data_dir: Directorio para datos (.csvin)
        trash_dir: Directorio oculto para la papelera
        trash_index: Archivo índice de la papelera
    """
    
    def __init__(self, path: Path):
        """
        Inicializa un proyecto.
        
        Args:
            path: Ruta al directorio del proyecto
        """
        self.path = PlatformPaths.normalize_path(Path(path))
        # Cambiar de .insanusnote.config a insanusnote.config (compatible con Windows)
        self.config_file = self.path / "insanusnote.config"
        self.config = self._load_config()
        
        # Directorios estándar
        self.notes_dir = self.path / self.config.get("notesPath", "notes")
        self.interfaces_dir = self.path / self.config.get("interfacesPath", "interfaces") 
        self.data_dir = self.path / self.config.get("dataPath", "data")
        
        # Cambiar de .trash a _trash (compatible con Windows)
        self.trash_dir = self.path / "_trash"
        self.trash_index = self.trash_dir / "trash_index.json"
        
        # Crear estructura si no existe
        self._create_structure()
    
    def _load_config(self) -> Dict:
        """
        Carga la configuración del proyecto.
        
        Returns:
            Diccionario con la configuración del proyecto. Si no existe archivo
            de configuración, retorna valores por defecto.
        """
        if self.config_file.exists():
            return read_json(self.config_file, {})
        # Configuración por defecto
        return {
            "name": self.path.name,
            "version": "2.0.0",
            "createdAt": datetime.now().timestamp(),
            "notesPath": "notes",
            "interfacesPath": "interfaces",
            "dataPath": "data",
        }
    
    def _create_structure(self):
        """
        Crea la estructura de directorios del proyecto.
        
        Crea los directorios para notas, interfaces, datos y la papelera.
        También inicializa el archivo de configuración si no existe.
        
        Raises:
            OSError: Si hay problemas al crear los directorios (permisos, espacio, etc.)
        """
        try:
            for directory in [self.notes_dir, self.interfaces_dir, self.data_dir]:
                directory.mkdir(parents=True, exist_ok=True)
            
            # Crear papelera (sin punto para Windows)
            self.trash_dir.mkdir(exist_ok=True)
            
            if not self.trash_index.exists():
                write_json(self.trash_index, {})
            
            # Guardar config si no existe
            if not self.config_file.exists():
                write_json(self.config_file, self.config)
                
        except OSError as e:
            logger.error(f"Error al crear estructura del proyecto en {self.path}: {e}")
            raise

    def move_to_trash(self, file_path: Path):
        """
        Mueve un archivo o carpeta a la papelera.
        
        Args:
            file_path: Ruta al archivo o directorio a mover a la papelera
            
        Note:
            El archivo se renombra con un UUID para evitar colisiones.
            La información original se guarda en el índice de la papelera.
        """
        if not file_path.exists():
            return

        import shutil
        import uuid
        
        # Generar nombre único para evitar colisiones
        unique_name = f"{uuid.uuid4()}_{file_path.name}"
        trash_path = self.trash_dir / unique_name
        
        # Mover archivo
        shutil.move(str(file_path), str(trash_path))
        
        # Actualizar índice
        index = self._load_trash_index()
        index[unique_name] = {
            "original_path": str(file_path.relative_to(self.path)),
            "deleted_at": datetime.now().timestamp(),
            "original_name": file_path.name,
            "is_dir": trash_path.is_dir()
        }
        self._save_trash_index(index)

    def restore_from_trash(self, unique_name: str):
        """
        Restaura un archivo de la papelera a su ubicación original.
        
        Args:
            unique_name: Nombre único del archivo en la papelera
            
        Note:
            Si la ubicación original ya existe, se genera un nombre alternativo
            añadiendo un contador al nombre del archivo.
        """
        index = self._load_trash_index()
        if unique_name not in index:
            return
            
        data = index[unique_name]
        trash_path = self.trash_dir / unique_name
        original_path = self.path / data["original_path"]
        
        if trash_path.exists():
            # Asegurar que el directorio destino existe
            original_path.parent.mkdir(parents=True, exist_ok=True)
            
            import shutil
            # Si ya existe el destino, buscar nombre alternativo
            if original_path.exists():
                stem = original_path.stem
                suffix = original_path.suffix
                counter = 1
                while original_path.exists():
                    original_path = original_path.with_name(f"{stem}_{counter}{suffix}")
                    counter += 1
            
            shutil.move(str(trash_path), str(original_path))
            
            # Eliminar del índice
            del index[unique_name]
            self._save_trash_index(index)

    def delete_from_trash(self, unique_name: str):
        """
        Elimina permanentemente un archivo de la papelera.
        
        Args:
            unique_name: Nombre único del archivo en la papelera
            
        Warning:
            Esta operación es irreversible. El archivo será eliminado permanentemente.
        """
        index = self._load_trash_index()
        if unique_name not in index:
            return
            
        import shutil
        trash_path = self.trash_dir / unique_name
        
        if trash_path.exists():
            if trash_path.is_dir():
                shutil.rmtree(trash_path)
            else:
                trash_path.unlink()
        
        del index[unique_name]
        self._save_trash_index(index)

    def empty_trash(self):
        """
        Vacía completamente la papelera.
        
        Warning:
            Esta operación elimina permanentemente todos los archivos en la papelera
            y no puede deshacerse.
        """
        import shutil
        for item in self.trash_dir.iterdir():
            if item.name == ".trash_index.json":
                continue
            if item.is_dir():
                shutil.rmtree(item)
            else:
                item.unlink()
        
        # Reiniciar índice
        self._save_trash_index({})

    def cleanup_old_trash(self):
        """
        Elimina archivos con más de 30 días en la papelera.
        
        Note:
            Esta función se ejecuta automáticamente al abrir un proyecto
            para mantener limpia la papelera.
        """
        index = self._load_trash_index()
        now = datetime.now().timestamp()
        thirty_days = 30 * 24 * 60 * 60
        
        new_index = index.copy()
        import shutil
        
        for unique_name, data in index.items():
            deleted_at = data.get("deleted_at", 0)
            if now - deleted_at > thirty_days:
                trash_path = self.trash_dir / unique_name
                if trash_path.exists():
                    if trash_path.is_dir():
                        shutil.rmtree(trash_path)
                    else:
                        trash_path.unlink()
                del new_index[unique_name]
        
        if len(new_index) != len(index):
            self._save_trash_index(new_index)

    def _load_trash_index(self) -> Dict:
        return read_json(self.trash_index, {})

    def _save_trash_index(self, index: Dict):
        write_json_atomic(self.trash_index, index)

class ProjectManager:
    """
    Gestiona múltiples proyectos de InsanusNotes.
    
    Mantiene el proyecto actual activo y un historial de proyectos recientes.
    
    Attributes:
        current_project: Proyecto actualmente abierto (None si no hay ninguno)
        recent_projects_file: Ruta al archivo de proyectos recientes del usuario
        recent_projects: Lista de rutas de proyectos recientes (máximo 10)
    """
    
    def __init__(self):
        """Inicializa el gestor de proyectos."""
        self.current_project: Optional[Project] = None
        self.config_manager = get_config_manager()
        # Usar config_manager en lugar de archivo local
        self.recent_projects: List[str] = self.config_manager.get_recent_projects()
    
    def create_project(self, path: Path, name: str) -> Project:
        """
        Crea un nuevo proyecto.
        
        Args:
            path: Directorio padre donde crear el proyecto
            name: Nombre del proyecto (será el nombre del directorio)
            
        Returns:
            Instancia del proyecto creado
            
        Raises:
            OSError: Si hay problemas al crear el directorio
            
        Note:
            El proyecto se añade automáticamente a la lista de recientes
            y se establece como proyecto actual.
        """
        try:
            project_path = path / name
            project_path.mkdir(parents=True, exist_ok=True)
            
            project = Project(project_path)
            project.cleanup_old_trash()
            
            # Usar config_manager para guardar recientes
            self.config_manager.add_recent_project(str(project_path.absolute()))
            self.recent_projects = self.config_manager.get_recent_projects()
            
            self.current_project = project
            logger.info(f"Proyecto creado: {project_path}")
            return project
            
        except OSError as e:
            logger.error(f"Error al crear proyecto en {path}/{name}: {e}")
            raise
    
    def open_project(self, path: Path) -> Project:
        """
        Abre un proyecto existente.
        
        Args:
            path: Ruta al directorio del proyecto
            
        Returns:
            Instancia del proyecto abierto
            
        Raises:
            FileNotFoundError: Si el proyecto no existe
            
        Note:
            El proyecto se mueve al inicio de la lista de recientes
            y se establece como proyecto actual.
        """
        path = PlatformPaths.normalize_path(Path(path))
        if not path.exists():
            raise FileNotFoundError(f"El proyecto no existe: {path}")
        
        project = Project(path)
        project.cleanup_old_trash()
        
        # Actualizar recientes usando config_manager
        self.config_manager.add_recent_project(str(path.absolute()))
        self.config_manager.set("last_project", str(path.absolute()))
        self.config_manager.save()
        self.recent_projects = self.config_manager.get_recent_projects()
        
        self.current_project = project
        logger.info(f"Proyecto abierto: {path}")
        return project
    
    def get_recent_projects(self) -> List[Path]:
        """
        Devuelve proyectos recientes como objetos Path.
        
        Returns:
            Lista de rutas a proyectos recientes que todavía existen
            
        Note:
            Solo retorna proyectos que existen actualmente en el sistema de archivos.
        """
        return [Path(p) for p in self.recent_projects if Path(p).exists()]
    
    def get_project_files(self, project: Project) -> List[Path]:
        """
        Obtiene lista de archivos del proyecto.
        
        Args:
            project: Proyecto del cual obtener los archivos
            
        Returns:
            Lista ordenada de rutas a archivos .mdin, .inin y .csvin
            
        Note:
            Busca recursivamente en los directorios notes, interfaces y data.
        """
        files = []
        extensions = ["*.mdin", "*.inin", "*.csvin"]
        if project.notes_dir.exists():
            for ext in extensions:
                files.extend(project.notes_dir.glob(f"**/{ext}"))
        if project.interfaces_dir.exists():
            for ext in extensions:
                files.extend(project.interfaces_dir.glob(f"**/{ext}"))
        if project.data_dir.exists():
            for ext in extensions:
                files.extend(project.data_dir.glob(f"**/{ext}"))
        return sorted(files)
    
    def close_project(self):
        """
        Cierra el proyecto actual.
        
        Note:
            Establece current_project a None. No elimina el proyecto de recientes.
        """
        self.current_project = None
"""Gestor de proyectos y archivos"""

import os
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

from utils.json_io import read_json, write_json, write_json_atomic

class Project:
    """Representa un proyecto de InsanusNotes"""
    
    def __init__(self, path: Path):
        self.path = path
        self.config_file = path / ".insanusnote.config"
        self.config = self._load_config()
        
        # Directorios estándar
        self.notes_dir = path / self.config.get("notesPath", "notes")
        self.interfaces_dir = path / self.config.get("interfacesPath", "interfaces") 
        self.data_dir = path / self.config.get("dataPath", "data")
        
        # Crear estructura si no existe
        self._create_structure()
    
    def _load_config(self) -> Dict:
        """Carga configuración del proyecto"""
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
        """Crea estructura de directorios"""
        for directory in [self.notes_dir, self.interfaces_dir, self.data_dir]:
            directory.mkdir(exist_ok=True)
            
        # Crear papelera oculta
        self.trash_dir = self.path / ".trash"
        self.trash_dir.mkdir(exist_ok=True)
        
        self.trash_index = self.trash_dir / ".trash_index.json"
        if not self.trash_index.exists():
            write_json(self.trash_index, {})
        
        # Guardar config si no existe
        if not self.config_file.exists():
            write_json(self.config_file, self.config)

    def move_to_trash(self, file_path: Path):
        """Mueve un archivo o carpeta a la papelera"""
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
        """Restaura un archivo de la papelera"""
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
        """Elimina permanentemente un archivo de la papelera"""
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
        """Vacía completamente la papelera"""
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
        """Elimina archivos con más de 30 días en la papelera"""
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
    """Gestiona múltiples proyectos"""
    
    def __init__(self):
        self.current_project: Optional[Project] = None
        self.recent_projects_file = Path.home() / ".insanusnotes_recent.json"
        self.recent_projects: List[str] = self._load_recent()
    
    def _load_recent(self) -> List[str]:
        """Carga proyectos recientes"""
        return read_json(self.recent_projects_file, [])
    
    def _save_recent(self):
        """Guarda lista de proyectos recientes"""
        try:
            write_json_atomic(self.recent_projects_file, self.recent_projects)
        except Exception:
            pass
    
    def create_project(self, path: Path, name: str) -> Project:
        """Crea un nuevo proyecto"""
        project_path = path / name
        project_path.mkdir(exist_ok=True)
        
        project = Project(project_path)
        project.cleanup_old_trash() # Limpieza inicial
        
        # Añadir a recientes
        project_str = str(project_path.absolute())
        if project_str in self.recent_projects:
            self.recent_projects.remove(project_str)
        self.recent_projects.insert(0, project_str)
        self.recent_projects = self.recent_projects[:10]  # Limitar a 10
        self._save_recent()
        
        self.current_project = project
        return project
    
    def open_project(self, path: Path) -> Project:
        """Abre un proyecto existente"""
        project = Project(path)
        project.cleanup_old_trash() # Limpieza inicial
        
        # Actualizar recientes
        project_str = str(path.absolute())
        if project_str in self.recent_projects:
            self.recent_projects.remove(project_str)
        self.recent_projects.insert(0, project_str)
        self.recent_projects = self.recent_projects[:10]
        self._save_recent()
        
        self.current_project = project
        return project
    
    def get_recent_projects(self) -> List[Path]:
        """Devuelve proyectos recientes como Paths"""
        return [Path(p) for p in self.recent_projects if Path(p).exists()]
    
    def get_project_files(self, project: Project) -> List[Path]:
        """Obtiene lista de archivos del proyecto (.mdin, .inin, .csvin)"""
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
        """Cierra el proyecto actual"""
        self.current_project = None
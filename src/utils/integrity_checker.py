"""
Validación de integridad de proyectos y datos.

Este módulo proporciona herramientas para verificar la integridad
de proyectos y recuperarse de errores de archivos.
"""

import logging
import shutil
from pathlib import Path
from typing import Dict, Tuple, List

from utils.json_io import read_json, write_json
from utils.platform_utils import Platform

logger = logging.getLogger(__name__)


class ProjectIntegrityValidator:
    """
    Valida y repara la integridad estructural de proyectos.
    """
    
    REQUIRED_DIRS = ["notes", "interfaces", "data"]
    REQUIRED_FILES = ["insanusnote.config"]
    
    @staticmethod
    def validate_project(project_path: Path) -> Tuple[bool, List[str]]:
        """
        Valida la estructura de un proyecto.
        
        Args:
            project_path: Ruta al directorio del proyecto
            
        Returns:
            Tupla (valid, issues) donde valid es bool y issues es lista de problemas
        """
        issues = []
        
        if not project_path.exists():
            return False, ["Directorio del proyecto no existe"]
        
        if not project_path.is_dir():
            return False, ["La ruta no es un directorio"]
        
        # Verificar directorios requeridos
        for dir_name in ProjectIntegrityValidator.REQUIRED_DIRS:
            dir_path = project_path / dir_name
            if not dir_path.exists():
                issues.append(f"Directorio faltante: {dir_name}/")
        
        # Verificar archivos de configuración
        config_file = project_path / "insanusnote.config"
        if not config_file.exists():
            issues.append("Archivo de configuración faltante: insanusnote.config")
        else:
            # Validar que sea JSON válido
            config = read_json(config_file, None)
            if config is None:
                issues.append("Archivo de configuración corrupto")
        
        # Verificar directorio de papelera
        trash_dir = project_path / "_trash"
        if not trash_dir.exists():
            issues.append("Directorio de papelera faltante: _trash/")
        else:
            trash_index = trash_dir / "trash_index.json"
            if not trash_index.exists():
                issues.append("Índice de papelera faltante")
            else:
                index = read_json(trash_index, None)
                if index is None:
                    issues.append("Índice de papelera corrupto")
        
        valid = len(issues) == 0
        return valid, issues
    
    @staticmethod
    def repair_project(project_path: Path) -> Tuple[bool, List[str]]:
        """
        Intenta reparar un proyecto dañado.
        
        Args:
            project_path: Ruta al directorio del proyecto
            
        Returns:
            Tupla (success, repairs) donde success es bool y repairs es lista de reparaciones hechas
        """
        repairs = []
        
        try:
            # Crear directorios faltantes
            for dir_name in ProjectIntegrityValidator.REQUIRED_DIRS:
                dir_path = project_path / dir_name
                if not dir_path.exists():
                    dir_path.mkdir(parents=True, exist_ok=True)
                    repairs.append(f"Directorio creado: {dir_name}/")
            
            # Recrear directorio de papelera si no existe
            trash_dir = project_path / "_trash"
            if not trash_dir.exists():
                trash_dir.mkdir(exist_ok=True)
                repairs.append("Directorio de papelera creado: _trash/")
            
            # Crear índice de papelera si no existe
            trash_index = trash_dir / "trash_index.json"
            if not trash_index.exists():
                write_json(trash_index, {})
                repairs.append("Índice de papelera creado")
            
            # Crear archivo de configuración si no existe
            config_file = project_path / "insanusnote.config"
            if not config_file.exists():
                default_config = {
                    "name": project_path.name,
                    "version": "2.0.0",
                    "notesPath": "notes",
                    "interfacesPath": "interfaces",
                    "dataPath": "data",
                }
                write_json(config_file, default_config)
                repairs.append("Archivo de configuración creado")
            
            return True, repairs
            
        except Exception as e:
            logger.error(f"Error al reparar proyecto: {e}")
            return False, repairs


class FileSystemValidator:
    """
    Valida y maneja problemas específicos del sistema de archivos.
    """
    
    @staticmethod
    def check_permissions(path: Path) -> bool:
        """
        Verifica permisos de lectura/escritura.
        
        Args:
            path: Ruta a verificar
            
        Returns:
            bool: True si tiene permisos adecuados
        """
        try:
            if not path.exists():
                # Intentar crear un archivo de prueba
                test_file = path / ".insanusnotes_test"
                test_file.touch()
                test_file.unlink()
            else:
                # Verificar permisos
                if path.is_dir():
                    test_file = path / ".insanusnotes_test"
                    test_file.touch()
                    test_file.unlink()
                else:
                    path.read_bytes().__len__()
            
            return True
        except (PermissionError, OSError):
            return False
    
    @staticmethod
    def is_path_safe(path: Path) -> bool:
        """
        Verifica si la ruta es segura para usar.
        
        Args:
            path: Ruta a verificar
            
        Returns:
            bool: True si la ruta es segura
        """
        try:
            # Resolver ruta absoluta
            resolved = path.resolve()
            
            # Verificar que no sea una ruta especial peligrosa
            dangerous_roots = ["/", "C:\\", "/System", "C:\\Windows", "C:\\Program Files"]
            for dangerous in dangerous_roots:
                if str(resolved).startswith(dangerous):
                    return False
            
            return True
        except Exception:
            return False
    
    @staticmethod
    def handle_locked_file(file_path: Path, max_retries: int = 3) -> bool:
        """
        Intenta manejar archivos bloqueados (especialmente en Windows).
        
        Args:
            file_path: Ruta al archivo bloqueado
            max_retries: Número máximo de reintentos
            
        Returns:
            bool: True si se pudo acceder/mover el archivo
        """
        if not Platform.is_windows():
            return True  # No es problema en otros SO
        
        import time
        
        for attempt in range(max_retries):
            try:
                # Intentar acceder al archivo
                file_path.stat()
                return True
            except (PermissionError, OSError) as e:
                if attempt < max_retries - 1:
                    time.sleep(0.5 * (attempt + 1))
                    continue
                
                logger.warning(f"Archivo bloqueado después de {max_retries} reintentos: {file_path}")
                return False
        
        return False


class DataIntegrityChecker:
    """
    Verifica la integridad de datos JSON almacenados.
    """
    
    @staticmethod
    def check_json_file(file_path: Path) -> Tuple[bool, str]:
        """
        Verifica un archivo JSON.
        
        Args:
            file_path: Ruta al archivo JSON
            
        Returns:
            Tupla (valid, message)
        """
        if not file_path.exists():
            return False, "Archivo no existe"
        
        data = read_json(file_path, None)
        if data is None:
            return False, "JSON inválido o corrupto"
        
        return True, "JSON válido"
    
    @staticmethod
    def backup_file(file_path: Path) -> bool:
        """
        Crea un backup de un archivo.
        
        Args:
            file_path: Ruta al archivo a respaldar
            
        Returns:
            bool: True si se creó el backup exitosamente
        """
        try:
            backup_path = file_path.with_suffix(file_path.suffix + ".bak")
            shutil.copy2(file_path, backup_path)
            logger.info(f"Backup creado: {backup_path}")
            return True
        except Exception as e:
            logger.error(f"Error al crear backup: {e}")
            return False


# Funciones de utilidad
def validate_and_repair_project(project_path: Path) -> Dict:
    """
    Valida un proyecto y lo repara si es necesario.
    
    Args:
        project_path: Ruta al proyecto
        
    Returns:
        Dict con información de validación y reparación
    """
    logger.info(f"Validando proyecto: {project_path}")
    
    result = {
        "project_path": str(project_path),
        "valid": False,
        "issues": [],
        "repaired": False,
        "repairs": [],
    }
    
    # Validar
    valid, issues = ProjectIntegrityValidator.validate_project(project_path)
    result["valid"] = valid
    result["issues"] = issues
    
    if not valid:
        logger.warning(f"Problemas detectados: {issues}")
        
        # Intentar reparar
        success, repairs = ProjectIntegrityValidator.repair_project(project_path)
        result["repaired"] = success
        result["repairs"] = repairs
        
        if success:
            # Re-validar después de reparar
            valid, new_issues = ProjectIntegrityValidator.validate_project(project_path)
            result["valid"] = valid
            result["issues"] = new_issues
            logger.info(f"Proyecto reparado: {success}")
    
    return result

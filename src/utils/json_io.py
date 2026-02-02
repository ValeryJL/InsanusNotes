"""
Utilidades para operaciones de entrada/salida de archivos JSON.

Este módulo proporciona funciones auxiliares para leer y escribir archivos JSON
de manera segura, incluyendo escritura atómica para prevenir corrupción de datos.

Incluye manejo robusto para Windows, especialmente para archivos bloqueados
por antivirus o procesos en ejecución.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


def read_json(path: Path, default: Any) -> Any:
    """
    Lee un archivo JSON de forma segura.
    
    Si el archivo no existe o hay un error al leerlo, retorna el valor por defecto.
    Incluye reintentos para manejar bloqueos de archivo en Windows.
    
    Args:
        path: Ruta al archivo JSON a leer
        default: Valor a retornar si el archivo no existe o falla la lectura
        
    Returns:
        Contenido del archivo JSON parseado, o el valor por defecto en caso de error
        
    Example:
        >>> config = read_json(Path("config.json"), {})
        >>> {'key': 'value'}
    """
    if not path.exists():
        return default
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (IOError, OSError) as e:
            if attempt < max_retries - 1:
                import time
                time.sleep(0.1 * (attempt + 1))  # Backoff exponencial
                continue
            logger.warning(f"Error al leer JSON {path}: {e}")
            return default
        except json.JSONDecodeError as e:
            logger.error(f"JSON inválido en {path}: {e}")
            return default
        except Exception as e:
            logger.error(f"Error inesperado al leer {path}: {e}")
            return default
    
    return default


def write_json(path: Path, data: Any, indent: int = 2) -> None:
    """
    Escribe datos a un archivo JSON de forma segura.
    
    Incluye manejo de errores para Windows (bloqueos, antivirus, etc.)
    
    Args:
        path: Ruta donde guardar el archivo JSON
        data: Datos a serializar (debe ser JSON-serializable)
        indent: Número de espacios para indentación (por defecto 2)
        
    Raises:
        IOError: Si hay un error al escribir el archivo
        
    Example:
        >>> write_json(Path("data.json"), {"name": "test"})
    """
    # Asegurar que el directorio existe
    path.parent.mkdir(parents=True, exist_ok=True)
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=indent, ensure_ascii=False)
            return
        except (IOError, OSError) as e:
            if attempt < max_retries - 1:
                import time
                time.sleep(0.1 * (attempt + 1))  # Backoff exponencial
                continue
            logger.error(f"Error al escribir JSON {path}: {e}")
            raise
        except TypeError as e:
            logger.error(f"Dato no serializable en JSON {path}: {e}")
            raise
        except Exception as e:
            logger.error(f"Error inesperado al escribir {path}: {e}")
            raise


def write_json_atomic(path: Path, data: Any, indent: int = 2) -> None:
    """
    Escribe datos a un archivo JSON de forma atómica y segura.
    
    Escribe primero a un archivo temporal y luego lo renombra al destino final.
    Esto previene corrupción de datos si el proceso es interrumpido durante la escritura.
    
    Incluye manejo robusto para Windows, especialmente para:
    - Archivos bloqueados por antivirus
    - Archivos abiertos en otros procesos
    - Rutas con espacios y caracteres especiales
    
    Args:
        path: Ruta donde guardar el archivo JSON
        data: Datos a serializar (debe ser JSON-serializable)
        indent: Número de espacios para indentación (por defecto 2)
        
    Raises:
        IOError: Si hay un error al escribir el archivo después de reintentos
        
    Note:
        Esta operación es atómica en sistemas POSIX. En Windows, usa rename()
        que es atómico desde Python 3.8+.
        
    Example:
        >>> write_json_atomic(Path("important.json"), {"critical": "data"})
    """
    # Asegurar que el directorio existe
    path.parent.mkdir(parents=True, exist_ok=True)
    
    # Generar ruta temporal en el mismo directorio (para evitar problemas entre sistemas de archivos)
    tmp_path = path.parent / f".{path.name}.tmp.{id(data)}"
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            # Escribir a archivo temporal
            with open(tmp_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=indent, ensure_ascii=False)
            
            # Reemplazar archivo destino con temporal (atómico)
            tmp_path.replace(path)
            return
            
        except (IOError, OSError) as e:
            if attempt < max_retries - 1:
                import time
                time.sleep(0.1 * (attempt + 1))  # Backoff exponencial
                continue
            
            # Limpiar temporal si existe
            try:
                tmp_path.unlink()
            except Exception:
                pass
            
            logger.error(f"Error al escribir JSON atómicamente en {path}: {e}")
            raise
            
        except TypeError as e:
            # Limpiar temporal si existe
            try:
                tmp_path.unlink()
            except Exception:
                pass
            
            logger.error(f"Dato no serializable en JSON {path}: {e}")
            raise
            
        except Exception as e:
            # Limpiar temporal si existe
            try:
                tmp_path.unlink()
            except Exception:
                pass
            
            logger.error(f"Error inesperado al escribir {path}: {e}")
            raise

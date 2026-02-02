"""
Utilidades para operaciones de entrada/salida de archivos JSON.

Este módulo proporciona funciones auxiliares para leer y escribir archivos JSON
de manera segura, incluyendo escritura atómica para prevenir corrupción de datos.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict


def read_json(path: Path, default: Any) -> Any:
    """
    Lee un archivo JSON de forma segura.
    
    Si el archivo no existe o hay un error al leerlo, retorna el valor por defecto.
    
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
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def write_json(path: Path, data: Any, indent: int = 2) -> None:
    """
    Escribe datos a un archivo JSON.
    
    Args:
        path: Ruta donde guardar el archivo JSON
        data: Datos a serializar (debe ser JSON-serializable)
        indent: Número de espacios para indentación (por defecto 2)
        
    Raises:
        IOError: Si hay un error al escribir el archivo
        
    Example:
        >>> write_json(Path("data.json"), {"name": "test"})
    """
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=indent, ensure_ascii=False)


def write_json_atomic(path: Path, data: Any, indent: int = 2) -> None:
    """
    Escribe datos a un archivo JSON de forma atómica.
    
    Escribe primero a un archivo temporal y luego lo renombra al destino final.
    Esto previene corrupción de datos si el proceso es interrumpido durante la escritura.
    
    Args:
        path: Ruta donde guardar el archivo JSON
        data: Datos a serializar (debe ser JSON-serializable)
        indent: Número de espacios para indentación (por defecto 2)
        
    Raises:
        IOError: Si hay un error al escribir el archivo
        
    Note:
        Esta operación es atómica en sistemas POSIX. El archivo original solo se
        reemplaza después de que la escritura del temporal es exitosa.
        
    Example:
        >>> write_json_atomic(Path("important.json"), {"critical": "data"})
    """
    tmp_path = path.with_suffix(path.suffix + ".tmp")
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=indent, ensure_ascii=False)
    tmp_path.replace(path)

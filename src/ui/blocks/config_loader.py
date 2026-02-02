from __future__ import annotations

import json
from configparser import ConfigParser
from pathlib import Path
from typing import Dict, Any


_BASE_DIR = Path(__file__).parent


def load_property_types() -> Dict[str, Any]:
    path = _BASE_DIR / "property_types.json"
    if not path.exists():
        return {
            "types": ["Texto", "Booleano", "Número", "Lista", "Arreglo"],
            "list_placeholder": "+ Agregar opción...",
            "array_item_types": ["Texto", "Booleano", "Número", "Lista"],
        }
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data if isinstance(data, dict) else {}


def load_block_defaults() -> Dict[str, Dict[str, str]]:
    path = _BASE_DIR / "block_defaults.conf"
    config = ConfigParser()
    if path.exists():
        config.read(path, encoding="utf-8")
    return {section: dict(config.items(section)) for section in config.sections()}

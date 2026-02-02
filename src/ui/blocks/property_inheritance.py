"""
Property inheritance and file validation logic.

This module handles inheritance from interface files and validation
of property relationships following the Strategy pattern.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Optional, Set


class PropertyInheritanceManager:
    """
    Manages property inheritance from interface files.
    
    Handles loading properties from parent files, validating file paths,
    and detecting circular dependencies.
    """

    def __init__(self, project_path: Optional[str], is_interface: bool):
        """
        Initialize the inheritance manager.
        
        Args:
            project_path: Path to the project root
            is_interface: Whether we're editing an interface file
        """
        self.project_path = project_path
        self.is_interface = is_interface

    def validate_implements_file(self, file_path: str) -> bool:
        """
        Validate that a file path can be used for implementation.
        
        Args:
            file_path: Relative path to the file
            
        Returns:
            True if the file is valid for inheritance
        """
        if not self.project_path:
            return False

        full_path = Path(self.project_path) / file_path
        if not full_path.exists():
            return False
            
        if self.is_interface and full_path.suffix != ".inin":
            return False
            
        if full_path.suffix not in [".mdin", ".inin"]:
            return False

        try:
            with open(full_path, "r", encoding="utf-8") as f:
                content = f.read()
                if content.strip():
                    json.loads(content)
            return True
        except Exception:
            return False

    def get_inherited_property_map(self, file_path: str, _seen: Optional[Set[str]] = None) -> Dict[str, str]:
        """
        Get a map of property names to types from a file and its parents.
        
        Handles circular dependencies by tracking visited files.
        
        Args:
            file_path: Relative path to the file
            _seen: Set of already visited files (for recursion)
            
        Returns:
            Dictionary mapping property names to their types
        """
        if not self.project_path:
            return {}
            
        if _seen is None:
            _seen = set()
            
        if file_path in _seen:
            return {}
            
        _seen.add(file_path)

        full_path = Path(self.project_path) / file_path
        if not full_path.exists():
            return {}

        try:
            with open(full_path, "r", encoding="utf-8") as f:
                content = f.read()
                if not content.strip():
                    return {}
                data = json.loads(content)

            prop_map = {}
            implements = None

            if isinstance(data, list):
                props_block = self._find_properties_block(data)
                if props_block and isinstance(props_block.get("content"), dict):
                    for name, info in props_block.get("content", {}).items():
                        if name == "Implementa":
                            if isinstance(info, dict):
                                implements = info.get("value")
                            continue
                        if isinstance(info, dict):
                            prop_map[name] = info.get("type", "Texto")
                        else:
                            prop_map[name] = "Texto"
            else:
                for prop in data.get("properties", []):
                    if isinstance(prop, dict):
                        prop_name = prop.get("name", "")
                        if prop_name and prop_name != "Implementa":
                            prop_map[prop_name] = prop.get("type", "Texto")
                implements = data.get("implements")

            # Recursively load from parent
            if implements:
                parent_map = self.get_inherited_property_map(implements, _seen)
                # Parent properties don't override child properties
                for k, v in parent_map.items():
                    if k not in prop_map:
                        prop_map[k] = v

            return prop_map

        except Exception:
            return {}

    def load_inherited_properties_data(self, file_path: str) -> Dict:
        """
        Load property data from a file for inheritance.
        
        Args:
            file_path: Relative path to the file
            
        Returns:
            Dictionary with 'properties' list and 'implements' path
        """
        if not self.project_path:
            return {"properties": [], "implements": None}

        full_path = Path(self.project_path) / file_path
        if not full_path.exists():
            return {"properties": [], "implements": None}

        try:
            with open(full_path, "r", encoding="utf-8") as f:
                content = f.read()
                if not content.strip():
                    return {"properties": [], "implements": None}
                data = json.loads(content)

            result = {"properties": [], "implements": None}

            if isinstance(data, list):
                props_block = self._find_properties_block(data)
                if props_block:
                    props_list = []
                    if isinstance(props_block.get("content"), dict):
                        for name, info in props_block.get("content", {}).items():
                            if name != "Implementa":
                                props_list.append({
                                    "name": name,
                                    "type": info.get("type", "Texto") if isinstance(info, dict) else "Texto",
                                    "value": info.get("value", "") if isinstance(info, dict) else "",
                                })
                            else:
                                if isinstance(info, dict):
                                    result["implements"] = info.get("value", "")
                    result["properties"] = props_list
            else:
                result["properties"] = data.get("properties", [])
                result["implements"] = data.get("implements")

            return result

        except Exception as e:
            print(f"Error loading inherited properties: {e}")
            return {"properties": [], "implements": None}

    def _find_properties_block(self, data: list) -> Optional[Dict]:
        """
        Find the properties block in a list of blocks.
        
        Args:
            data: List of block data
            
        Returns:
            Properties block dictionary or None
        """
        for block in data:
            if isinstance(block, dict) and block.get("type") == "properties":
                return block
        return None

    def get_file_list(self) -> List[str]:
        """
        Get list of valid files for implementation autocomplete.
        
        Returns:
            List of relative file paths
        """
        if not self.project_path:
            return []

        files = []
        project_path = Path(self.project_path)
        extensions = ["**/*.inin"] if self.is_interface else ["**/*.mdin", "**/*.inin"]
        
        for pattern in extensions:
            for file_path in project_path.glob(pattern):
                if ".trash" in file_path.parts:
                    continue
                rel_path = file_path.relative_to(project_path)
                files.append(str(rel_path))

        return files

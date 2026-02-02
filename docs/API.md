# API Reference - InsanusNotes

## Core API

### ProjectManager

```python
from core.project_manager import ProjectManager, Project

# Crear gestor de proyectos
pm = ProjectManager()

# Crear un nuevo proyecto
project = pm.create_project(Path("/ruta/base"), "Mi Proyecto")

# Abrir proyecto existente
project = pm.open_project(Path("/ruta/al/proyecto"))

# Obtener proyectos recientes
recent = pm.get_recent_projects()  # List[Path]

# Obtener archivos del proyecto
files = pm.get_project_files(project)  # List[Path]

# Cerrar proyecto
pm.close_project()
```

### Project

```python
from core.project_manager import Project
from pathlib import Path

# Crear/abrir proyecto
project = Project(Path("/ruta/al/proyecto"))

# Acceder a directorios
project.notes_dir      # Path a carpeta de notas
project.interfaces_dir # Path a carpeta de interfaces
project.data_dir       # Path a carpeta de datos

# Sistema de papelera
project.move_to_trash(archivo_path)           # Mover a papelera
project.restore_from_trash(unique_name)       # Restaurar
project.delete_from_trash(unique_name)        # Eliminar permanentemente
project.empty_trash()                         # Vaciar papelera
project.cleanup_old_trash()                   # Limpiar archivos antiguos
```

## UI API

### MainWindow

```python
from ui.main_window import MainWindow
from core.project_manager import ProjectManager

pm = ProjectManager()
window = MainWindow(pm)
window.show()
```

### EditorCanvas

```python
from ui.editor_canvas import EditorCanvas
from ui.theme_manager import ThemeManager

# Crear canvas
theme_manager = ThemeManager()
canvas = EditorCanvas(project_path=Path("/proyecto"), theme_manager=theme_manager)

# Inicializar nota vacía
canvas.init_empty_note()

# Añadir bloque
from ui.blocks import TextBlock
block = TextBlock(theme_manager=theme_manager)
canvas.add_block(block)

# Serializar a JSON
data = canvas.to_dict()

# Deserializar desde JSON
canvas.from_dict(data)
```

### Bloques

#### BaseBlock

Todos los bloques heredan de `BaseBlock` e implementan:

```python
class MiBloque(BaseBlock):
    def to_dict(self) -> dict:
        """Serializa el bloque a diccionario"""
        pass
    
    def from_dict(self, data: dict):
        """Deserializa desde diccionario"""
        pass
    
    def get_plain_text(self) -> str:
        """Retorna texto plano del bloque"""
        pass
```

Señales disponibles:
- `got_focus(object)`: Bloque obtuvo el foco
- `content_changed()`: Contenido cambió
- `split_requested(object, str)`: Solicitud de dividir bloque
- `delete_requested(object)`: Solicitud de eliminar bloque

#### TextBlock

```python
from ui.blocks import TextBlock

block = TextBlock(theme_manager=theme_manager)

# Obtener/establecer contenido
markdown = block.get_markdown()
block.set_markdown("# Título\nContenido")

# Serialización
data = block.to_dict()  # {"type": "text", "content": "..."}
block.from_dict(data)
```

#### TableBlock

```python
from ui.blocks import TableBlock

block = TableBlock(rows=3, cols=3)

# Obtener datos
data = block.to_dict()
# {
#   "type": "table",
#   "rows": 3,
#   "cols": 3,
#   "data": [[...], [...], ...]
# }
```

#### HeaderBlock

```python
from ui.blocks import HeaderBlock

block = HeaderBlock()
title = block.get_title()
block.set_title("Título de la Nota")
```

#### PropertiesBlock

```python
from ui.blocks import PropertiesBlock

block = PropertiesBlock(project_path=Path("/proyecto"), is_interface=False)

# Propiedades se gestionan mediante UI
# Tipos soportados: text, select, multi_select, date, number, checkbox, url, file
```

### ThemeManager

```python
from ui.theme_manager import ThemeManager

tm = ThemeManager()

# Obtener temas disponibles
temas = tm.themes  # Dict[str, dict]

# Establecer tema
tm.set_theme("insanus_dark")
tm.set_theme("insanus_light")

# Generar QSS
qss = tm.generate_qss()
app.setStyleSheet(qss)

# Tema actual
tema = tm.get_current_theme()
```

## Utilities API

### json_io

```python
from utils.json_io import read_json, write_json, write_json_atomic
from pathlib import Path

# Lectura segura
data = read_json(Path("config.json"), default={})

# Escritura estándar
write_json(Path("data.json"), {"key": "value"})

# Escritura atómica (recomendado para datos críticos)
write_json_atomic(Path("important.json"), {"critical": "data"})
```

## Estructuras de Datos

### Formato de Nota (.mdin)

```json
{
  "version": "2.0",
  "blocks": [
    {
      "type": "header",
      "title": "Título de la Nota"
    },
    {
      "type": "properties",
      "properties": {
        "Created": {"type": "date", "value": "2024-01-01"},
        "Status": {"type": "select", "value": "En Progreso"}
      }
    },
    {
      "type": "text",
      "content": "# Contenido\nTexto en **Markdown**"
    },
    {
      "type": "table",
      "rows": 2,
      "cols": 3,
      "data": [
        ["A1", "B1", "C1"],
        ["A2", "B2", "C2"]
      ]
    }
  ]
}
```

### Configuración de Proyecto (.insanusnote.config)

```json
{
  "name": "Mi Proyecto",
  "version": "2.0.0",
  "createdAt": 1704067200.0,
  "notesPath": "notes",
  "interfacesPath": "interfaces",
  "dataPath": "data"
}
```

### Índice de Papelera (.trash/.trash_index.json)

```json
{
  "uuid_archivo.mdin": {
    "original_path": "notes/documento.mdin",
    "deleted_at": 1704067200.0,
    "original_name": "documento.mdin",
    "is_dir": false
  }
}
```

## Eventos y Señales

### Señales de EditorCanvas

```python
# Conectar a cambios de contenido
canvas.content_changed.connect(lambda: print("Contenido modificado"))
```

### Señales de Bloques

```python
# Bloque obtiene foco
block.got_focus.connect(lambda b: print(f"Foco en {b}"))

# Contenido cambia
block.content_changed.connect(lambda: print("Contenido cambió"))

# Solicitud de división (solo TextBlock)
block.split_requested.connect(lambda b, txt: print(f"Dividir en {txt}"))

# Solicitud de eliminación
block.delete_requested.connect(lambda b: print(f"Eliminar {b}"))
```

## Extensiones

### Crear un Nuevo Tipo de Bloque

1. Heredar de `BaseBlock`:

```python
from ui.blocks.base import BaseBlock

class MiNuevoBloque(BaseBlock):
    def __init__(self):
        super().__init__()
        # Configurar UI
    
    def to_dict(self) -> dict:
        return {
            "type": "mi_bloque",
            "data": "..."
        }
    
    def from_dict(self, data: dict):
        # Cargar datos
        pass
    
    def get_plain_text(self) -> str:
        return "texto plano"
```

2. Registrar en `ui/blocks/__init__.py`:

```python
from .mi_nuevo_bloque import MiNuevoBloque

__all__ = ['BaseBlock', 'TextBlock', 'TableBlock', 'MiNuevoBloque']
```

3. Añadir al EditorCanvas si es necesario

### Crear un Nuevo Tema

Editar `ui/themes.json`:

```json
{
  "mi_tema_custom": {
    "name": "Mi Tema",
    "colors": {
      "background_primary": "#FFFFFF",
      "background_sidebar": "#F5F5F5",
      "text_main": "#000000",
      "accent": "#0066CC",
      "border": "#E0E0E0",
      ...
    }
  }
}
```

## Convenciones de Código

- **Imports**: Ordenar en bloques (estándar, terceros, locales)
- **Docstrings**: Usar para clases y métodos públicos
- **Type Hints**: Usar siempre que sea posible
- **Nombres**: `snake_case` para funciones, `PascalCase` para clases
- **Privados**: Prefijo `_` para métodos internos

## Recursos Adicionales

- [README.md](../README.md) - Introducción y guía de inicio
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Guía de contribución
- [ARCHITECTURE.md](ARCHITECTURE.md) - Documentación de arquitectura

---

**Versión**: 2.0.0  
**Última actualización**: Febrero 2026

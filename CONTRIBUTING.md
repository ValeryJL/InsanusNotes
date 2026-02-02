# Guía de Contribución - InsanusNotes

¡Gracias por tu interés en contribuir a InsanusNotes! Este documento establece las normas y estándares de programación para mantener la calidad y consistencia del código.

## 📋 Tabla de Contenidos

- [Estándares de Código](#estándares-de-código)
- [Estructura de Archivos](#estructura-de-archivos)
- [Convenciones de Nombres](#convenciones-de-nombres)
- [Documentación](#documentación)
- [Commits y Pull Requests](#commits-y-pull-requests)
- [Testing](#testing)

## 🎯 Estándares de Código

### Estilo General

- **Seguir PEP 8**: Adherirse a las guías de estilo de Python (PEP 8)
- **Límite de línea**: 100 caracteres (flexible para strings largos)
- **Indentación**: 4 espacios (no tabs)
- **Encoding**: UTF-8 para todos los archivos Python
- **Imports**: Organizados en tres grupos (estándar, terceros, locales) separados por líneas en blanco

### Ejemplo de Imports

```python
# Librerías estándar de Python
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional

# Librerías de terceros
from PyQt6.QtWidgets import QWidget, QVBoxLayout
from PyQt6.QtCore import Qt, pyqtSignal

# Imports locales
from utils.json_io import read_json, write_json
from models import Project
```

### Type Hints

- **Usar type hints** siempre que sea posible
- Importar tipos de `typing` cuando sea necesario
- Documentar tipos de retorno de funciones

```python
def create_project(path: Path, name: str) -> Project:
    """Crea un nuevo proyecto."""
    pass
```

## 📂 Estructura de Archivos

### Organización de Carpetas

```
src/
├── core/           # Lógica de negocio principal
├── models/         # Modelos de datos y estructuras
├── ui/             # Componentes de interfaz de usuario
│   ├── blocks/     # Bloques del editor
│   └── widgets/    # Widgets personalizados
└── utils/          # Utilidades y helpers
    ├── platform_paths.py      # Gestión de rutas multiplataforma
    ├── platform_utils.py      # Detección de SO
    ├── config_manager.py      # Configuración global
    ├── integrity_checker.py   # Validación de proyectos
    └── json_io.py             # Operaciones I/O JSON
```

### Compatibilidad Multiplataforma

InsanusNotes soporta Windows, macOS y Linux. Al contribuir, ten en cuenta:

- **Rutas**: Usar `pathlib.Path` en lugar de strings de rutas
- **Directorios**: Usar `PlatformPaths` para acceder a directorios estándar del SO
- **SO-específico**: Si necesitas lógica específica del SO, usar `Platform.is_windows()`, `Platform.is_macos()`, etc.
- **Archivos**: Evitar caracteres inválidos en Windows (`:`, `*`, `?`, `"`, `<`, `>`, `|`)
- **Líneas nuevas**: Python maneja automáticamente `\n` vs `\r\n`

**Ejemplo de código multiplataforma**:
```python
from utils.platform_paths import PlatformPaths
from utils.platform_utils import Platform

# Obtener directorio estándar del SO
config_dir = PlatformPaths.get_config_dir()

# Lógica específica de SO si es necesaria
if Platform.is_windows():
    # Código específico de Windows
    pass
elif Platform.is_macos():
    # Código específico de macOS
    pass
else:  # Linux
    # Código específico de Linux
    pass
```

### Reglas de Organización

1. **Un concepto por archivo**: Cada archivo debe tener una responsabilidad clara
2. **Módulos cohesivos**: Agrupar código relacionado en el mismo módulo
3. **Bajo acoplamiento**: Minimizar dependencias entre módulos
4. **Archivos grandes**: Si un archivo supera las 500 líneas, considerar dividirlo

## 🏷️ Convenciones de Nombres

### Python (PEP 8)

- **Clases**: `PascalCase` (ej: `ProjectManager`, `TextBlock`)
- **Funciones/métodos**: `snake_case` (ej: `create_project`, `save_file`)
- **Variables**: `snake_case` (ej: `project_path`, `current_theme`)
- **Constantes**: `UPPER_SNAKE_CASE` (ej: `MAX_RECENT_PROJECTS`, `DEFAULT_THEME`)
- **Privados**: Prefijo `_` (ej: `_internal_method`, `_helper_function`)

### Archivos

- **Módulos Python**: `snake_case.py` (ej: `project_manager.py`, `json_io.py`)
- **Archivos de configuración**: `kebab-case` o `snake_case` (ej: `themes.json`, `block_defaults.conf`)

## 📝 Documentación

### Docstrings

**Usar docstrings para**:
- Módulos (al inicio del archivo)
- Clases
- Funciones y métodos públicos
- Funciones complejas, aunque sean privadas

**Formato recomendado**:

```python
def function_name(param1: Type1, param2: Type2) -> ReturnType:
    """
    Breve descripción de una línea.
    
    Descripción más detallada si es necesaria. Explica el propósito,
    el comportamiento y cualquier detalle importante.
    
    Args:
        param1: Descripción del primer parámetro
        param2: Descripción del segundo parámetro
        
    Returns:
        Descripción de lo que retorna la función
        
    Raises:
        ExceptionType: Cuándo y por qué se lanza esta excepción
        
    Example:
        >>> function_name(value1, value2)
        expected_result
    """
    pass
```

### Comentarios

- **Comentarios claros**: Explicar el "por qué", no el "qué"
- **Actualizar comentarios**: Mantener sincronizados con el código
- **Evitar comentarios obvios**: No documentar lo evidente
- **TODO/FIXME**: Usar para marcar trabajo pendiente

```python
# TODO: Implementar validación de entrada
# FIXME: Bug cuando el archivo no existe
# NOTE: Este método se llama desde múltiples hilos
```

## 🔄 Commits y Pull Requests

### Mensajes de Commit

**Formato**:
```
<tipo>: <descripción breve>

<descripción detallada opcional>
```

**Tipos**:
- `feat`: Nueva característica
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Formato, punto y coma faltante, etc.
- `refactor`: Refactorización de código
- `test`: Agregar o modificar tests
- `chore`: Tareas de mantenimiento

**Ejemplos**:
```
feat: Agregar soporte para tablas en el editor
fix: Corregir error al guardar archivo vacío
docs: Actualizar README con nuevas instrucciones
refactor: Reorganizar módulo de gestión de proyectos
```

### Pull Requests

1. **Descripción clara**: Explicar qué cambia y por qué
2. **Referencias**: Mencionar issues relacionados
3. **Revisión**: Solicitar revisión de código
4. **Tests**: Asegurar que los tests pasan
5. **Documentación**: Actualizar docs si es necesario

## 🧪 Testing

### Principios

- **Escribir tests**: Para nueva funcionalidad crítica
- **Tests unitarios**: Probar componentes aislados
- **Tests de integración**: Para flujos completos
- **Cobertura**: Apuntar a 70%+ de cobertura de código crítico

### Estructura de Tests

```python
def test_function_name():
    """Descripción de lo que se está probando."""
    # Arrange - Preparar datos
    data = create_test_data()
    
    # Act - Ejecutar función
    result = function_under_test(data)
    
    # Assert - Verificar resultado
    assert result == expected_value
```

## 🛠️ Herramientas Recomendadas

### Formateo de Código

- **Black**: Formateador automático de código
- **isort**: Ordenar imports automáticamente

### Linting

- **pylint**: Análisis estático de código
- **flake8**: Verificación de estilo PEP 8
- **mypy**: Verificación de type hints

### Uso

```bash
# Formatear código
black src/

# Ordenar imports
isort src/

# Verificar estilo
flake8 src/

# Verificar tipos
mypy src/
```

## 🚫 Anti-Patrones a Evitar

1. **God Objects**: Clases que hacen demasiado
2. **Código duplicado**: Usar funciones/clases reutilizables
3. **Magic numbers**: Usar constantes con nombres descriptivos
4. **Imports innecesarios**: Eliminar imports no usados
5. **Funciones muy largas**: Dividir en funciones más pequeñas (< 50 líneas)
6. **Anidamiento excesivo**: Máximo 3-4 niveles de anidamiento

## 📐 Mejores Prácticas

### Gestión de Errores

```python
# Bueno
try:
    result = risky_operation()
except SpecificException as e:
    logger.error(f"Error específico: {e}")
    handle_error()
    
# Evitar
try:
    result = risky_operation()
except:  # Demasiado genérico
    pass  # Silenciar errores es mala práctica
```

### Recursos

```python
# Bueno - Usar context managers
with open(file_path, 'r') as f:
    data = f.read()

# Evitar - Olvidar cerrar recursos
f = open(file_path, 'r')
data = f.read()
# ¿Dónde está f.close()?
```

### Diseño de Clases

```python
class WellDesignedClass:
    """
    Clase bien diseñada con responsabilidad única.
    """
    
    def __init__(self, config: Dict):
        """Inicialización clara."""
        self.config = config
        self._setup()
    
    def _setup(self):
        """Método privado de configuración."""
        pass
        
    def public_method(self) -> str:
        """Método público bien documentado."""
        return "result"
```

## 🤔 Preguntas Frecuentes

**P: ¿Debo agregar type hints a todo el código?**
R: Prioriza funciones públicas y APIs. Para código interno simple, es opcional.

**P: ¿Cuándo crear un nuevo módulo?**
R: Cuando un archivo supere 500 líneas o cuando agrupe funcionalidad relacionada que pueda ser reutilizada.

**P: ¿Puedo usar código de terceros?**
R: Sí, pero asegúrate de que tenga licencia compatible y sea mantenido activamente.

## 📞 Contacto

Si tienes dudas sobre estas normas, abre un issue o contacta a los mantenedores del proyecto.

---

**Última actualización**: Febrero 2026

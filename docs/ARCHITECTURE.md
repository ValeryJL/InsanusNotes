# Arquitectura de InsanusNotes

## Visión General

InsanusNotes está construido siguiendo una arquitectura modular que separa claramente las responsabilidades entre diferentes componentes del sistema.

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                     main.py                              │
│                 (Punto de Entrada)                       │
└────────────────────┬────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
┌─────────▼─────────┐  ┌────────▼──────────┐
│   Core Module     │  │    UI Module       │
│                   │  │                    │
│ - ProjectManager  │◄─┤ - MainWindow       │
│ - Project         │  │ - EditorCanvas     │
│                   │  │ - Blocks           │
└─────────┬─────────┘  │ - Widgets          │
          │            │ - ThemeManager     │
          │            └────────┬───────────┘
          │                     │
┌─────────▼─────────┐  ┌────────▼───────────┐
│  Utils Module     │  │  Models Module     │
│                   │  │                    │
│ - json_io         │  │ - (Data Models)    │
│                   │  │                    │
└───────────────────┘  └────────────────────┘
```

## Módulos Principales

### 1. Core Module (`src/core/`)

**Responsabilidad**: Lógica de negocio principal y gestión de proyectos.

**Componentes**:
- `project_manager.py`: Gestión de proyectos, archivos y sistema de papelera

**Características**:
- Creación y apertura de proyectos
- Gestión de estructura de directorios
- Sistema de papelera con restauración
- Limpieza automática de archivos antiguos (>30 días)
- Historial de proyectos recientes

### 2. UI Module (`src/ui/`)

**Responsabilidad**: Interfaz gráfica de usuario basada en PyQt6.

**Componentes principales**:

#### `main_window.py`
- Ventana principal de la aplicación
- Barra de menús
- Gestión de temas
- Navegación entre proyectos

#### `editor_canvas.py`
- Canvas principal del editor
- Contenedor de bloques
- Gestión de focus y señales
- Estructura de notas (header + properties + content)

#### `blocks/` (Subsistema de Bloques)

**Arquitectura de Bloques**:

```
BaseBlock (base.py)
    ├── HeaderBlock (header_block.py)
    ├── PropertiesBlock (properties_block.py)
    ├── TextBlock (text_block.py)
    └── TableBlock (table_block.py)
```

Cada bloque:
- Hereda de `BaseBlock`
- Emite señales para comunicación
- Gestiona su propio estado
- Serializable a JSON

**Bloques disponibles**:
- `HeaderBlock`: Título de la nota
- `PropertiesBlock`: Metadatos y propiedades personalizadas
- `TextBlock`: Texto con formato Markdown
- `TableBlock`: Tablas editables

#### `widgets/`
- Widgets personalizados reutilizables
- `table_insert.py`: Selector de tamaño de tabla

#### Otros componentes UI:
- `project_selector.py`: Selector inicial de proyectos
- `slash_menu.py`: Menú contextual de comandos
- `trash_dialog.py`: Diálogo de papelera
- `theme_manager.py`: Gestión de temas
- `file_icon_provider.py`: Iconos personalizados

### 3. Models Module (`src/models/`)

**Responsabilidad**: Definición de estructuras de datos.

**Estado actual**: Módulo placeholder para futuras extensiones.

### 4. Utils Module (`src/utils/`)

**Responsabilidad**: Funciones auxiliares y utilidades.

**Componentes**:
- `json_io.py`: Operaciones de lectura/escritura JSON
  - `read_json()`: Lectura segura con fallback
  - `write_json()`: Escritura estándar
  - `write_json_atomic()`: Escritura atómica para prevenir corrupción

## Flujo de Datos

### Creación de Nota

```
Usuario → MainWindow → EditorCanvas → Bloques
                          ↓
                    ProjectManager
                          ↓
                    Sistema de Archivos
```

### Guardado de Cambios

```
Bloque (edición) → señal content_changed
                          ↓
                    EditorCanvas (agrega cambios)
                          ↓
                    AutoSave Timer (1s)
                          ↓
                    Serialización JSON
                          ↓
                    write_json_atomic()
                          ↓
                    Sistema de Archivos
```

### Sistema de Señales (PyQt6)

Los bloques se comunican mediante señales:

- `got_focus`: Cuando un bloque obtiene el foco
- `content_changed`: Cuando el contenido cambia
- `split_requested`: Solicitud de dividir bloque
- `delete_requested`: Solicitud de eliminar bloque
- `table_insert_requested`: Solicitud de insertar tabla

## Gestión de Estado

### Estado de la Aplicación

```python
MainWindow
  ├── project_manager: ProjectManager
  │     └── current_project: Project
  ├── theme_manager: ThemeManager
  ├── current_file_path: Path
  └── editor_canvas: EditorCanvas
          └── blocks: List[BaseBlock]
```

### Persistencia

**Archivos del proyecto**:
- `.insanusnote.config`: Configuración del proyecto
- `notes/*.mdin`: Notas en formato Markdown
- `interfaces/*.inin`: Interfaces (páginas especiales)
- `data/*.csvin`: Datos CSV
- `.trash/`: Papelera del proyecto
- `.trash/.trash_index.json`: Índice de papelera

**Archivos del usuario**:
- `~/.insanusnotes_recent.json`: Proyectos recientes

## Patrones de Diseño Utilizados

### 1. **Observer Pattern**
- Implementado vía señales PyQt6
- Bloques emiten señales, EditorCanvas las observa

### 2. **Factory Pattern**
- Creación de bloques según tipo
- Slash menu como factory de bloques

### 3. **Strategy Pattern**
- Renderizado de diferentes tipos de propiedades
- Diferentes estrategias de serialización

### 4. **Singleton Pattern**
- ThemeManager
- ProjectManager (una instancia activa)

## Extensibilidad

### Agregar un Nuevo Tipo de Bloque

1. Crear clase heredando de `BaseBlock`
2. Implementar métodos requeridos:
   - `to_dict()`: Serialización
   - `from_dict()`: Deserialización
   - `get_plain_text()`: Texto plano
3. Registrar en `blocks/__init__.py`
4. Agregar a slash menu si es necesario

### Agregar un Nuevo Tema

1. Editar `ui/themes.json`
2. Definir colores y estilos
3. El ThemeManager lo cargará automáticamente

### Agregar un Nuevo Tipo de Archivo

1. Extender ProjectManager para soportar nueva extensión
2. Crear renderer/editor específico
3. Actualizar navegación de archivos

## Dependencias Principales

- **PyQt6**: Framework de interfaz gráfica
- **markdown**: Renderizado de Markdown
- **markdown-it-py**: Parser de Markdown alternativo
- **pygments**: Syntax highlighting
- **pyyaml**: Configuración YAML
- **watchdog**: Observación de sistema de archivos

## Seguridad

### Escritura Atómica de Archivos

Para prevenir corrupción de datos:
1. Escribir a archivo temporal (`.tmp`)
2. Verificar escritura exitosa
3. Reemplazar archivo original

### Validación de Entrada

- Sanitización de rutas de archivo
- Validación de nombres de proyecto
- Escapado de contenido HTML/Markdown

## Performance

### Optimizaciones Implementadas

1. **Auto-guardado debounced**: Timer de 1 segundo evita guardados excesivos
2. **Carga lazy**: Archivos se cargan solo cuando se abren
3. **Serialización eficiente**: JSON compacto para archivos grandes
4. **Limpieza periódica**: Papelera se limpia automáticamente

### Consideraciones Futuras

- Virtualización de listas largas de bloques
- Caché de renderizado de Markdown
- Índice de búsqueda para proyectos grandes

## Testing

### Estrategia de Testing

- **Unidad**: Funciones puras (json_io, utils)
- **Integración**: Flujos completos de usuario
- **UI**: Tests manuales con escenarios de uso

### Áreas Críticas para Testing

1. Sistema de guardado/carga
2. Gestión de papelera
3. Serialización de bloques
4. Sincronización de estado

## Limitaciones Conocidas

1. **Escalabilidad**: No optimizado para >10,000 notas
2. **Concurrencia**: Sin soporte para edición multi-usuario
3. **Versionado**: Sin historial de versiones de documentos
4. **Búsqueda**: Búsqueda básica, sin índice full-text

## Roadmap Futuro

1. Sistema de plugins
2. Sincronización en la nube
3. Colaboración en tiempo real
4. Mobile app companion
5. Exportación a múltiples formatos
6. API REST para integración

---

**Versión**: 2.0.0  
**Última actualización**: Febrero 2026

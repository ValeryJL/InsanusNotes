# InsanusNotes

**InsanusNotes** es un editor de notas tipo Notion desarrollado en Python con soporte **multiplataforma** (Windows, macOS, Linux). Permite crear y gestionar notas con bloques de texto enriquecido, tablas, propiedades personalizadas y comandos slash.

## 🚀 Características

- **Editor de bloques modular**: Sistema de bloques similar a Notion
- **Comandos Slash**: Menú contextual para insertar diferentes tipos de bloques
- **Múltiples tipos de bloques**:
  - Bloques de texto con formato Markdown
  - Tablas editables
  - Propiedades personalizadas
  - Encabezados
- **Gestión de proyectos**: Organiza tus notas en proyectos separados
- **Sistema de papelera**: Recupera archivos eliminados
- **Temas personalizables**: Interfaz con soporte para múltiples temas
- **Auto-guardado**: Guarda automáticamente los cambios
- **Multiplataforma**: Funciona en Windows, macOS y Linux

## 📋 Requisitos

- Python 3.8 o superior
- PyQt6
- Dependencias adicionales (ver `requirements.txt`)

## 🔧 Instalación Rápida

### Windows
```cmd
run.bat
```

### macOS / Linux
```bash
bash run.sh
```

### Cualquier plataforma
```bash
python run.py
```

### Instalación Manual

1. **Clona el repositorio**:
```bash
git clone https://github.com/ValeryJL/InsanusNotes.git
cd InsanusNotes
```

2. **Instala las dependencias**:
```bash
pip install -r requirements.txt
```

3. **Ejecuta la aplicación**:
```bash
python main.py
```

Para instrucciones detalladas de instalación por plataforma, consulta [docs/INSTALL_MULTIPLATFORM.md](docs/INSTALL_MULTIPLATFORM.md).

## 📁 Estructura del Proyecto

```
InsanusNotes/
├── main.py                 # Punto de entrada de la aplicación
├── requirements.txt        # Dependencias del proyecto
├── run.py                  # Launcher universal
├── run.sh                  # Launcher para Linux/macOS
├── run.bat                 # Launcher para Windows
└── src/
    ├── core/              # Lógica de negocio principal
    │   └── project_manager.py  # Gestión de proyectos
    ├── ui/                # Interfaz de usuario
    │   ├── blocks/        # Componentes de bloques
    │   ├── widgets/       # Widgets personalizados
    │   ├── main_window.py        # Ventana principal
    │   ├── editor_canvas.py      # Canvas del editor
    │   ├── project_selector.py   # Selector de proyectos
    │   └── theme_manager.py      # Gestor de temas
    └── utils/             # Utilidades
        ├── platform_paths.py     # Gestión de rutas multiplataforma
        ├── platform_utils.py     # Detección de SO
        ├── config_manager.py     # Configuración global
        ├── integrity_checker.py  # Validación de proyectos
        └── json_io.py            # Operaciones I/O JSON
```

## 🎨 Uso

### Crear un Proyecto

1. Ejecuta la aplicación
2. Selecciona "Nuevo Proyecto" desde el selector inicial
3. Elige una ubicación y nombre para el proyecto

### Crear Notas

1. Abre un proyecto existente
2. Usa el menú contextual o atajos de teclado para crear nuevas notas
3. Las notas se organizan automáticamente en la estructura del proyecto

### Comandos Slash

Presiona `/` en un bloque de texto para abrir el menú de comandos:
- `/h1`, `/h2`, `/h3` - Encabezados de diferentes niveles
- `/table` - Insertar tabla
- Y más...

### Atajos de Teclado

- `Ctrl+Shift+N` (Windows/Linux) | `Cmd+Shift+N` (macOS): Nuevo proyecto
- `Ctrl+Shift+O` (Windows/Linux) | `Cmd+Shift+O` (macOS): Abrir proyecto
- `Ctrl+Q` (Windows/Linux) | `Cmd+Q` (macOS): Salir
- `Ctrl+S` (Windows/Linux) | `Cmd+S` (macOS): Guardar (auto-guardado habilitado por defecto)

## 🏗️ Arquitectura

InsanusNotes sigue una arquitectura modular:

- **Core**: Lógica de negocio, gestión de proyectos y archivos
- **UI**: Componentes visuales basados en PyQt6
- **Utils**: Funciones auxiliares, gestión de rutas, configuración y validación

Consulta [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para más detalles.

## 🤝 Contribuir

Lee la [Guía de Contribución](CONTRIBUTING.md) para conocer las normas y estándares del proyecto.

## 📚 Documentación

- [Guía de Instalación Multiplataforma](docs/INSTALL_MULTIPLATFORM.md)
- [Arquitectura del Proyecto](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [Guía de Contribución](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## 📝 Licencia

Este proyecto es de código abierto.

## 👥 Autores

- Desarrollado por ValeryJL

## 🐛 Reportar Problemas

Si encuentras algún problema o tienes sugerencias, por favor abre un issue en el repositorio de GitHub.

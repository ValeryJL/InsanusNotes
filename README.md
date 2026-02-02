# InsanusNotes

**InsanusNotes** es un editor de notas tipo Notion desarrollado en Python nativo para Linux, que permite crear y gestionar notas con soporte para bloques de texto enriquecido, tablas, propiedades personalizadas y comandos slash.

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

## 📋 Requisitos

- Python 3.8 o superior
- PyQt6
- Dependencias adicionales (ver `requirements.txt`)

## 🔧 Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/ValeryJL/InsanusNotes.git
cd InsanusNotes
```

2. Instala las dependencias:
```bash
pip install -r requirements.txt
```

3. Ejecuta la aplicación:
```bash
python main.py
```

## 📁 Estructura del Proyecto

```
InsanusNotes/
├── main.py                 # Punto de entrada de la aplicación
├── requirements.txt        # Dependencias del proyecto
└── src/
    ├── core/              # Lógica de negocio principal
    │   ├── __init__.py
    │   └── project_manager.py  # Gestión de proyectos
    ├── models/            # Modelos de datos
    │   └── __init__.py
    ├── ui/                # Interfaz de usuario
    │   ├── blocks/        # Componentes de bloques
    │   │   ├── base.py           # Clase base para bloques
    │   │   ├── text_block.py     # Bloque de texto
    │   │   ├── table_block.py    # Bloque de tabla
    │   │   ├── header_block.py   # Bloque de encabezado
    │   │   └── properties_block.py # Bloque de propiedades
    │   ├── widgets/       # Widgets personalizados
    │   ├── main_window.py        # Ventana principal
    │   ├── editor_canvas.py      # Canvas del editor
    │   ├── project_selector.py   # Selector de proyectos
    │   └── theme_manager.py      # Gestor de temas
    └── utils/             # Utilidades
        ├── __init__.py
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

- `Ctrl+Shift+N`: Nuevo proyecto
- `Ctrl+Shift+O`: Abrir proyecto
- `Ctrl+Q`: Salir
- `Ctrl+S`: Guardar (auto-guardado habilitado por defecto)

## 🏗️ Arquitectura

InsanusNotes sigue una arquitectura modular:

- **Core**: Lógica de negocio, gestión de proyectos y archivos
- **UI**: Componentes visuales basados en PyQt6
- **Models**: Estructuras de datos
- **Utils**: Funciones auxiliares y utilidades

## 🤝 Contribuir

Lee la [Guía de Contribución](CONTRIBUTING.md) para conocer las normas y estándares del proyecto.

## 📝 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia que se especifique.

## 👥 Autores

- Desarrollado por ValeryJL

## 🐛 Reportar Problemas

Si encuentras algún problema o tienes sugerencias, por favor abre un issue en el repositorio de GitHub.

## 📚 Documentación Adicional

Para más información sobre la arquitectura y desarrollo, consulta la carpeta `docs/`.

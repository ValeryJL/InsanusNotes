# Changelog - InsanusNotes

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-02-02

### Added - Soporte Multiplataforma
- **Compatibilidad Windows/macOS/Linux completada**
  - Gestión de rutas dinámicas según sistema operativo
  - Directorios estándar del SO (AppData, Library, .local/share)
  - Scripts de ejecución para cada plataforma (run.bat, run.sh, run.py)
  
- **Nuevos módulos de utilidad**
  - `utils.platform_paths`: Gestión centralizada de rutas multiplataforma
  - `utils.platform_utils`: Detección de SO y configuración UI adaptable
  - `utils.config_manager`: Gestión centralizada de configuración global
  - `utils.integrity_checker`: Validación y reparación automática de proyectos
  
- **Mejoras de robustez Windows**
  - Manejo de archivos bloqueados con reintentos automáticos
  - Escritura atómica de JSON mejorada
  - Detección y manejo de errores de antivirus
  - Nombres de archivos compatibles (sin caracteres inválidos)

- **Características UI multiplataforma**
  - Detección automática de tema del SO (claro/oscuro)
  - Atajos de teclado adaptativos (Cmd en macOS, Ctrl en Windows/Linux)
  - Fuentes nativas por plataforma
  - Logging estructurado y mensajes informativos

- **Documentación**
  - docs/INSTALL_MULTIPLATFORM.md: Guía de instalación por plataforma

### Changed
- **Refactorización de core**
  - `core.project_manager`: Uso de PlatformPaths y ConfigManager
  - Cambio de convención: `.insanusnote.config` → `insanusnote.config`
  - Cambio de papelera: `.trash` → `_trash` (compatible con Windows)
  - Mejor error handling y logging

- **Mejoras en utilidades**
  - `utils.json_io`: Reintentos automáticos, backoff exponencial
  - `utils.json_io`: Creación automática de directorios antes de escribir
  - `ui.theme_manager`: Integración con ConfigManager y detección de SO

- **Actualización de entrada**
  - `main.py`: Verificación de dependencias y directorios
  - `main.py`: Logging informativo y manejo de errores mejorado

### Improved
- Compatibilidad multiplataforma (Windows 10+, macOS 10.13+, Linux)
- Robustez ante errores de I/O en Windows
- Experiencia de usuario adaptada al SO
- Almacenamiento de datos en directorios estándar por SO
- Validación y recuperación automática de proyectos dañados

## [1.0.0] - Previous Version

### Features
- Editor de notas tipo Notion
- Sistema de bloques modulares
- Gestión de proyectos
- Sistema de papelera con restauración
- Temas personalizables
- Auto-guardado
- Comandos slash
- Soporte para múltiples tipos de bloques:
  - Texto con Markdown
  - Tablas editables
  - Propiedades personalizadas
  - Encabezados

---

Para más detalles sobre cada versión, consulta los commits en el repositorio.

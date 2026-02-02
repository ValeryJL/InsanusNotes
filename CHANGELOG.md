# Changelog - InsanusNotes

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-02-02

### Added
- Comprehensive documentation system
  - README.md with project overview and quick start guide
  - CONTRIBUTING.md with coding standards and best practices
  - docs/ARCHITECTURE.md with detailed architecture documentation
  - docs/API.md with complete API reference
- Module-level docstrings for all Python files
- Class and method docstrings following Google style guide
- Type hints for better code clarity and IDE support
- Inline comments for complex logic

### Changed
- Improved code organization and structure
- Enhanced docstrings across all modules:
  - `core.project_manager`: Project and ProjectManager classes
  - `utils.json_io`: JSON I/O utilities
  - `ui.blocks.base`: Base block classes
  - `ui.main_window`: Main application window
  - `ui.editor_canvas`: Editor canvas
  - `ui.theme_manager`: Theme management
- Standardized import ordering (standard library, third-party, local)

### Improved
- Code quality and maintainability
- Developer onboarding experience
- Documentation coverage
- Code discoverability through better docstrings

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

# Setup Guide / Guía de Instalación

## English

### Initial Setup

After cloning or pulling updates from the repository, you **must** run:

```bash
npm install
```

This installs all required dependencies, including `@floating-ui/dom` which is needed by TipTap.

**Verify Installation:**
```bash
npm run verify
```

This checks if all critical dependencies are installed correctly.

### Build and Run

```bash
# Build the application
npm run build

# Start the application
npm start

# Development mode with auto-rebuild
npm run dev
```

### Common Issues

#### Error: Cannot resolve '@floating-ui/dom'

**Problem:** The `@floating-ui/dom` dependency is not installed.

**Solution:**
```bash
git pull                # Get latest changes
rm -rf node_modules     # Remove old dependencies
npm install             # Reinstall all dependencies
npm run build           # Build the project
```

#### Error: better-sqlite3 Native Module Version Mismatch

**Problem:** Error message like "was compiled against a different Node.js version using NODE_MODULE_VERSION..."

**Cause:** The `better-sqlite3` native module needs to be compiled specifically for Electron's Node.js version.

**Solution:**
```bash
npm run rebuild         # Rebuild native modules for Electron
# OR
npm install             # postinstall script will automatically rebuild
```

**Note:** The `postinstall` script now automatically rebuilds `better-sqlite3` when you run `npm install`, so this should be handled automatically in most cases.

#### Build Fails After Pulling Updates

Always run `npm install` after pulling changes, as package.json may have been updated with new dependencies.

---

## Español

### Configuración Inicial

Después de clonar o actualizar desde el repositorio, **debes** ejecutar:

```bash
npm install
```

Esto instala todas las dependencias requeridas, incluyendo `@floating-ui/dom` que es necesario para TipTap.

**Verificar Instalación:**
```bash
npm run verify
```

Esto verifica si todas las dependencias críticas están instaladas correctamente.

### Compilar y Ejecutar

```bash
# Compilar la aplicación
npm run build

# Iniciar la aplicación
npm start

# Modo desarrollo con recompilación automática
npm run dev
```

### Problemas Comunes

#### Error: Cannot resolve '@floating-ui/dom'

**Problema:** La dependencia `@floating-ui/dom` no está instalada.

**Solución:**
```bash
git pull                # Obtener últimos cambios
rm -rf node_modules     # Eliminar dependencias antiguas
npm install             # Reinstalar todas las dependencias
npm run build           # Compilar el proyecto
```

#### Error: Versión del Módulo Nativo better-sqlite3 No Coincide

**Problema:** Mensaje de error como "was compiled against a different Node.js version using NODE_MODULE_VERSION..."

**Causa:** El módulo nativo `better-sqlite3` necesita ser compilado específicamente para la versión de Node.js de Electron.

**Solución:**
```bash
npm run rebuild         # Recompilar módulos nativos para Electron
# O
npm install             # El script postinstall recompilará automáticamente
```

**Nota:** El script `postinstall` ahora recompila automáticamente `better-sqlite3` cuando ejecutas `npm install`, por lo que esto debería manejarse automáticamente en la mayoría de los casos.

#### La Compilación Falla Después de Actualizar

Siempre ejecuta `npm install` después de hacer pull de cambios, ya que package.json puede haber sido actualizado con nuevas dependencias.

---

## Dependencies / Dependencias

This project requires the following key dependencies:

- **Electron**: Desktop application framework
- **React**: UI framework
- **TipTap**: Rich text editor (requires `@floating-ui/dom`)
- **TypeScript**: Type-safe development
- **SQLite (better-sqlite3)**: Database
- **Chokidar**: File system watcher

Este proyecto requiere las siguientes dependencias principales:

- **Electron**: Framework para aplicaciones de escritorio
- **React**: Framework de UI
- **TipTap**: Editor de texto enriquecido (requiere `@floating-ui/dom`)
- **TypeScript**: Desarrollo con tipado seguro
- **SQLite (better-sqlite3)**: Base de datos
- **Chokidar**: Monitor de sistema de archivos

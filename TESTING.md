# Testing InsanusNotes

## Build Test

The application builds successfully with webpack:
```bash
npm run build
```

This produces:
- `dist/main.js` - Main Electron process
- `dist/preload.js` - Preload script
- `dist/renderer/renderer.js` - React renderer
- `dist/renderer/index.html` - HTML entry point

## Type Checking

TypeScript compilation passes without errors:
```bash
npx tsc --noEmit
```

## Manual Testing

To manually test the application:

1. Build the application:
   ```bash
   npm run build
   ```

2. Start Electron (headless mode may not work):
   ```bash
   npm start
   ```

3. Test the following features:
   - Create a new note
   - Edit note content with TipTap editor
   - Save note with metadata
   - Set interface on a note
   - Create interface files in the filesystem
   - Add CSV data files
   - Verify file watcher picks up changes
   - Test reference resolution

## Core Functionality

The application implements:

✅ Electron main process with IPC handlers
✅ SQLite database for indexing
✅ File system watcher (chokidar)
✅ Note management with YAML frontmatter parsing
✅ Interface management with inheritance
✅ CSV data management
✅ React UI with TipTap editor
✅ Reference resolution system

## Known Limitations

- Electron app requires a display (won't run in headless CI)
- Reference resolution in the UI requires additional implementation
- Advanced CSV parsing (quotes, escapes) is simplified

## Integration Testing

To properly test the application, you need:
- A Linux desktop environment
- X11 or Wayland display server
- Run `npm start` and interact with the GUI

# InsanusNotes - Implementation Summary

## Overview
InsanusNotes is a complete Notion-like note-taking and knowledge management application built with Electron, React, TipTap, and SQLite. It provides cursor-aware editing, reference resolution, and a project-based workflow.

## Core Features Implemented

### 1. Project-Based Workflow
- **Project Selection Window**: First window on startup for creating/opening projects
- **`.insanusnote.config`**: Project metadata file with name, path, created date
- **Recent Projects**: Tracks up to 10 recent projects
- **Project Management**: Create, open, and manage project directories

### 2. File Explorer
- **Tree View**: Shows all files and folders in project
- **File Operations**: Create files (any extension), delete files, create folders
- **File Type Icons**: Different icons for folders, markdown, PDFs, images, etc.
- **External File Support**: Opens non-markdown files with default system applications
- **React Dialogs**: Modal dialogs for file/folder creation (no browser prompt() issues)

### 3. Notion-Style Editor
- **Cursor-Aware Rendering**: 
  - When cursor is IN element → shows raw syntax (e.g., `[[reference]]`)
  - When cursor is OUT → shows formatted/resolved content (e.g., "Resolved Text")
- **Title Extraction**: Automatically extracts `# Title` from markdown and shows separately
- **No Title in Body**: Title completely hidden from editor content
- **Clean Interface**: Minimalist design with no visible toolbars

### 4. Reference System
- **Reference Menu**: Type `[[` to open autocomplete menu showing all files
- **Auto-Resolution**: References automatically resolve to actual content via IPC
- **Cursor-Aware Display**:
  - Editing: Shows `[[filename]]` with gray background
  - Viewing: Shows resolved content as blue link
- **Click to Navigate**: Click resolved references to open referenced files
- **Support for Multiple Reference Types**:
  - File references: `[[filename]]`
  - Property references: `[[filename.property]]`
  - CSV data: `[[file.row.column]]`

### 5. Properties Panel
- **Hover-Based**: Appears when hovering over title
- **Key-Value Editor**: Full editor for custom properties
- **Interface Property**: First property (dropdown) for interface selection
- **Add/Delete**: Add custom properties with ➕, delete with 🗑️
- **String Values**: All properties are strings (type system planned for future)
- **Auto-Save**: Properties save automatically to metadata

### 6. Slash Commands
- **Type `/` to Open**: Command palette appears when typing `/`
- **15+ Commands**:
  - Headings (H1, H2, H3)
  - Lists (Bullet, Numbered, Task)
  - Code Block
  - Table (3x3)
  - Quote
  - Divider (Horizontal Rule)
  - Formatting (Bold, Italic, Strike, etc.)
- **Keyboard Navigation**: Arrow keys to select, Enter to execute
- **Filter as You Type**: Commands filter based on input

### 7. Complete Markdown Support
- **All Syntax Types**:
  - All heading levels (H1-H6)
  - Bullet lists, numbered lists, task lists (with checkboxes)
  - Tables (with row/column management)
  - Code blocks (with syntax highlighting)
  - Inline code
  - Bold, italic, underline, strikethrough
  - Links and images
  - Blockquotes
  - Horizontal rules

### 8. Save Functionality
- **Auto-Save**: Automatically saves 1 second after last change
- **Manual Save**: Diskette icon (💾) button for manual save
- **Visual Feedback**: Shows "Saved!" message on successful save
- **YAML Frontmatter**: Metadata stored in frontmatter, content in body

### 9. Security & Performance
- **Content Security Policy**: Strict CSP without unsafe-eval
- **Webpack Configuration**: Uses inline-source-map for debugging
- **Context Isolation**: Electron context isolation enabled
- **Native Module Fix**: electron-rebuild for better-sqlite3 compatibility
- **Console Warning Suppression**: Harmless D-Bus, WebGL, DevTools warnings suppressed

## Technical Architecture

### Main Process (Node.js)
- **DatabaseManager**: SQLite schema and indexing
- **NoteManager**: Markdown parsing with YAML frontmatter, interface validation
- **InterfaceManager**: Schema definitions with recursive inheritance
- **DataManager**: CSV parsing and querying
- **FileSystemWatcher**: Real-time file monitoring with Chokidar
- **ProjectManager**: Project lifecycle management
- **FileManager**: File system operations

### Renderer Process (React + TypeScript)
- **NotionEditorFinal**: Complete TipTap-based editor (700+ lines)
- **FileExplorer**: Tree view file browser
- **App**: Main application component
- **Custom TipTap Extensions**:
  - Reference node with cursor-aware rendering
  - Slash command extension
  - All standard markdown extensions

### IPC Communication
- **Preload Script**: Exposes safe APIs to renderer
- **Type-Safe**: Full TypeScript types for all IPC calls
- **Async Operations**: All file operations are async
- **Error Handling**: Proper error messages and fallbacks

## Key Files

### Source Code
```
src/
├── main/
│   ├── main.ts                 # Main process entry, window management
│   ├── preload.ts              # IPC bridge with type safety
│   ├── database/manager.ts     # SQLite database management
│   ├── notes/manager.ts        # Note operations
│   ├── interfaces/manager.ts   # Interface validation
│   ├── data/manager.ts         # CSV data handling
│   ├── filesystem/watcher.ts   # File watching
│   ├── projects/manager.ts     # Project management
│   └── files/manager.ts        # File operations
├── renderer/
│   ├── App.tsx                 # Main React app
│   ├── renderer.tsx            # React entry point
│   ├── components/
│   │   ├── NotionEditorFinal.tsx    # Main editor (700+ lines)
│   │   ├── FileExplorer.tsx         # File browser
│   │   ├── NoteList.tsx             # Note list
│   │   └── NoteEditor.tsx           # Original editor
│   ├── styles.css              # Main styles
│   ├── notion-editor-styles.css     # Editor-specific styles
│   ├── file-explorer-styles.css     # Explorer styles
│   ├── index.html              # Main HTML
│   ├── project-selection.html  # Project selection window
│   └── project-selection.js    # Project selection logic
└── shared/
    └── types.ts                # Shared TypeScript types
```

### Configuration
```
package.json                    # Dependencies and scripts
tsconfig.json                   # TypeScript configuration
webpack.config.js               # Build configuration (3 targets)
.gitignore                      # Git ignore patterns
```

### Examples
```
examples/
├── README.md                   # Example usage guide
├── interfaces/                 # Example interface definitions
│   ├── entity.md
│   ├── character.md
│   └── location.md
├── notes/                      # Example notes
│   ├── aria-shadowblade.md
│   └── silverwood-forest.md
└── data/                       # Example CSV data
    ├── equipment.csv
    └── spells.csv
```

## Build Commands

```bash
# Install dependencies
npm install

# Build all targets (main, preload, renderer)
npm run build

# Start application
npm start

# Development mode (watch for changes)
npm run dev

# Rebuild native modules
npm run rebuild

# Verify installation
npm run verify
```

## Features by Priority

### Implemented ✅
1. Project-based workflow with config files
2. File explorer with create/delete operations
3. Notion-style cursor-aware editor
4. Reference resolution system
5. Key-value properties panel
6. Complete markdown support
7. Slash commands
8. Auto-save and manual save
9. External file opening
10. Console warning suppression
11. Native module compilation fix
12. Security (CSP, context isolation)

### Planned for Future
1. Property types (boolean, number, array, etc.)
2. Quote references
3. Interface inheritance UI
4. Search functionality
5. Graph view of references
6. Export functionality
7. Themes/customization
8. Plugin system

## Known Issues & Limitations

### Current Status
- ✅ File creation works via React dialogs
- ✅ Reference resolution functional
- ✅ Properties panel working
- ✅ Build completes without errors
- ✅ All webpack targets compile successfully

### Technical Notes
1. **D-Bus Warning**: Harmless Linux systemd warning, suppressed via command-line flags
2. **WebGL Warning**: Harmless GPU warning, suppressed
3. **DevTools Autofill**: Harmless protocol messages, can be ignored
4. **better-sqlite3**: Requires electron-rebuild for proper compilation

## Usage Guide

### Creating a Project
1. Launch app → Project Selection Window appears
2. Click "New Project"
3. Enter project name and select location
4. Click "Create"
5. Main window opens with your project

### Working with Files
1. Use File Explorer sidebar to browse files
2. Click file to open in editor
3. Click "New File" button to create files
4. Click "New Folder" button to create folders
5. Click 🗑️ to delete files/folders

### Using the Editor
1. **Title**: Shows separately at top, extracted from `# Title` in markdown
2. **Properties**: Hover over title to see/edit properties
3. **References**: Type `[[` to insert references, they auto-resolve
4. **Slash Commands**: Type `/` for formatting menu
5. **Save**: Auto-saves or click 💾 to save manually

### References
- `[[filename]]` - Links to another file
- `[[filename.property]]` - Shows property value
- `[[csvfile.row.column]]` - Shows CSV cell data

## Development Notes

### Cursor-Aware Rendering
The editor uses TipTap's NodeViewRenderer to create custom React components for references. Each reference node checks the editor's selection state to determine if the cursor is within it:

```typescript
const isSelected = editor.state.selection.from >= pos && 
                   editor.state.selection.to <= pos + node.nodeSize;

if (isSelected) {
  // Show raw: [[filename]]
} else {
  // Show resolved: Resolved Content
}
```

### Title Extraction
Title is extracted from the first line of markdown if it starts with `# `:

```typescript
const lines = markdown.split('\n');
if (lines[0].startsWith('# ')) {
  title = lines[0].substring(2);
  content = lines.slice(1).join('\n');
}
```

### Properties Storage
Properties are stored in note metadata and serialized to YAML frontmatter:

```yaml
---
interface: Character
name: Aria Shadowblade
class: Ranger
level: 12
---

# Aria Shadowblade

Character content here...
```

## Conclusion

InsanusNotes is now a fully functional Notion-like knowledge management application with:
- ✅ Complete project-based workflow
- ✅ Professional file explorer
- ✅ Cursor-aware Notion-style editor
- ✅ Reference resolution system
- ✅ Full markdown support
- ✅ Properties management
- ✅ Security best practices
- ✅ Clean, modern UI

The application is ready for use as a powerful note-taking and knowledge management tool for programmers and world-builders.

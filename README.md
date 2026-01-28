# InsanusNotes

A Linux-first, object-oriented note-taking and knowledge management application for programmers and world-builders. Built with Electron, React, TypeScript, TipTap, and SQLite.

## 🌟 Overview

InsanusNotes treats notes as **instances** of classes (interfaces), enabling structured knowledge management with:
- **Project-based workflow** - Each project is a self-contained workspace
- **Interface-based schemas** - Define note structures with inheritance
- **Dynamic references** - Link notes and query CSV data with `[[Note.prop]]` or `[[Data.row.col]]`
- **Real-time indexing** - SQLite database indexes your filesystem automatically
- **Multi-format support** - Markdown files in editor, others open with default apps

## 📦 Installation

### Prerequisites

- **Node.js** 20.x or higher
- **npm** 10.x or higher
- **Linux** (primary target, may work on macOS/Windows with modifications)

### Setup

```bash
# Clone the repository
git clone https://github.com/ValeryJL/InsanusNotes.git
cd InsanusNotes

# Install dependencies (includes automatic native module rebuild)
npm install

# Build the application
npm run build

# Start the application
npm start
```

## 🔨 Build Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies and rebuild native modules for Electron |
| `npm run build` | Compile TypeScript and bundle with Webpack |
| `npm start` | Build and launch the Electron app |
| `npm run dev` | Watch mode for development (auto-rebuild on changes) |
| `npm run rebuild` | Manually rebuild native modules (better-sqlite3) for Electron |
| `npm run package` | Create distributable packages (AppImage, deb) |

## 📁 Project Structure

```
InsanusNotes/
├── src/                          # Source code
│   ├── main/                     # Electron main process (Node.js)
│   │   ├── main.ts              # Entry point, window management, IPC handlers
│   │   ├── preload.ts           # Preload script for secure IPC
│   │   ├── projects/            # Project management
│   │   │   └── manager.ts       # Create/open projects, .insanusnote.config
│   │   ├── files/               # File system operations
│   │   │   └── manager.ts       # Create/delete/rename files, open external
│   │   ├── notes/               # Note management
│   │   │   └── manager.ts       # Parse markdown, YAML frontmatter, validation
│   │   ├── interfaces/          # Interface (schema) management
│   │   │   └── manager.ts       # Schema definitions, inheritance resolution
│   │   ├── data/                # CSV data management
│   │   │   └── manager.ts       # Parse CSV, query data
│   │   ├── filesystem/          # File watching
│   │   │   └── watcher.ts       # Chokidar-based real-time file monitoring
│   │   └── database/            # Database
│   │       └── manager.ts       # SQLite schema and operations
│   ├── renderer/                 # Electron renderer process (React)
│   │   ├── App.tsx              # Main app component with layout
│   │   ├── renderer.tsx         # React entry point
│   │   ├── index.html           # Main window HTML
│   │   ├── project-selection.html # Project selection window HTML
│   │   ├── project-selection.js # Project selection logic
│   │   ├── components/          # React components
│   │   │   ├── FileExplorer.tsx # File browser sidebar
│   │   │   ├── NoteEditor.tsx   # TipTap markdown editor
│   │   │   └── NoteList.tsx     # (Legacy) Note list component
│   │   ├── styles.css           # Main styles
│   │   └── file-explorer-styles.css # File explorer styles
│   └── shared/                   # Shared between main and renderer
│       └── types.ts             # TypeScript type definitions
├── examples/                     # Example project files
│   ├── notes/                   # Example notes
│   ├── interfaces/              # Example interface definitions
│   └── data/                    # Example CSV files
├── dist/                        # Build output (generated)
│   ├── main.js                 # Compiled main process
│   ├── preload.js              # Compiled preload script
│   └── renderer/               # Compiled renderer assets
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── webpack.config.js           # Webpack build configuration
└── .gitignore                  # Git ignore rules
```

## 🎨 Architecture

### Main Process (Node.js)

**Entry Point:** `src/main/main.ts`

The main process manages:
- **Window Management** - Project selection and main editor windows
- **IPC Communication** - Handles requests from renderer
- **Managers:**
  - `ProjectManager` - Project lifecycle (create, open, recent projects)
  - `FileManager` - File operations (CRUD, external opening)
  - `NoteManager` - Markdown parsing, interface validation
  - `InterfaceManager` - Schema definitions with inheritance
  - `DataManager` - CSV parsing and querying
  - `DatabaseManager` - SQLite indexing
  - `FileSystemWatcher` - Real-time file monitoring

### Renderer Process (React + TypeScript)

**Entry Point:** `src/renderer/renderer.tsx`

The renderer displays:
- **Project Selection Window** - Beautiful UI for create/open project
- **Main Window** - File explorer + editor layout
- **Components:**
  - `FileExplorer` - Sidebar with file tree and create/delete operations
  - `NoteEditor` - TipTap-based markdown editor with toolbar
  - `App` - Main layout orchestrator

### Data Flow

```
User Action (Renderer)
    ↓
IPC Call (preload.ts exposes window.api)
    ↓
IPC Handler (main.ts)
    ↓
Manager Method (e.g., FileManager.createFile)
    ↓
File System / Database Operation
    ↓
Response back through IPC
    ↓
Update UI (React state)
```

## ✏️ How to Edit Each Part

### Adding New Features

#### 1. Add IPC Handler (Main Process)

Edit `src/main/main.ts`:

```typescript
// Add IPC handler
ipcMain.handle('myfeature:action', async (_, param: string) => {
  try {
    // Your logic here
    return result;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
});
```

#### 2. Expose API (Preload Script)

Edit `src/main/preload.ts`:

```typescript
contextBridge.exposeInMainWorld('api', {
  // ... existing APIs
  myfeature: {
    action: (param: string) => ipcRenderer.invoke('myfeature:action', param)
  }
});
```

#### 3. Update Types (Shared)

Edit `src/shared/types.ts`:

```typescript
export interface InsanusAPI {
  // ... existing
  myfeature: {
    action: (param: string) => Promise<Result>;
  };
}
```

#### 4. Use in Renderer

Edit `src/renderer/components/MyComponent.tsx`:

```typescript
const result = await window.api.myfeature.action('param');
```

### Modifying the UI

#### Styling

- **Main styles:** `src/renderer/styles.css`
- **File explorer:** `src/renderer/file-explorer-styles.css`
- Uses CSS Grid/Flexbox with dark theme

#### Editor Customization

Edit `src/renderer/components/NoteEditor.tsx`:

```typescript
const editor = useEditor({
  extensions: [
    StarterKit,
    Link,
    // Add more TipTap extensions here
  ],
  // ... configuration
});
```

### Database Schema

Edit `src/database/manager.ts`:

```typescript
async initialize(): Promise<void> {
  // Add new tables
  this.db.exec(`
    CREATE TABLE IF NOT EXISTS my_table (
      id TEXT PRIMARY KEY,
      -- columns
    );
  `);
}
```

### File System Operations

Edit `src/main/files/manager.ts` to add file operations like copy, move, etc.

## 🚀 Usage

### First Launch

1. **Start the app:** `npm start`
2. **Project Selection Window** appears:
   - Click **"New Project"** to create
   - Enter project name and location
   - Click **"Open Project"** for existing projects

### Working with Files

**File Explorer (Left Sidebar):**
- 📄 **New File** - Click file icon, enter name with extension (e.g., `note.md`)
- 📁 **New Folder** - Click folder icon, enter folder name
- 🗑️ **Delete** - Hover over file/folder, click × button
- 📝 **Open** - Click `.md` files to edit, others open in default app

### Note Structure

```markdown
---
interface: Character
name: Aria
class: Ranger
level: 12
---

# Aria Shadowblade

A skilled ranger from [[Note.silverwood-forest.name]].

Equipment: [[Data.equipment.0.name]]
```

### Interface Definition

```markdown
# Interface: Character
Extends: Entity

## Schema
- name: string (required)
- class: string (required)
- level: number
- equipment: array
```

## 🔧 Troubleshooting

### Native Module Errors

**Error:** `was compiled against a different Node.js version using NODE_MODULE_VERSION...`

**Solution:**
```bash
npm run rebuild
# or
rm -rf node_modules
npm install
```

### File/Folder Creation Not Working

**Symptoms:** Clicking create buttons does nothing or shows errors

**Solutions:**
1. Ensure a project is opened (not just app launched)
2. Check browser console (F12) for JavaScript errors
3. Check terminal for main process errors
4. Verify write permissions in project directory

### Build Fails

```bash
# Clean build
rm -rf node_modules dist
npm install
npm run build
```

### App Won't Start

1. Check Electron version compatibility
2. Verify all dependencies installed: `npm install`
3. Rebuild native modules: `npm run rebuild`
4. Check logs in terminal

### D-Bus Warning (Linux Only)

**Warning:** `Failed to call method: org.freedesktop.systemd1.Manager.StartTransientUnit: ... UnitExists`

**This is harmless.** Electron/Chromium shows this warning on Linux systems with systemd when the browser process tries to register but the unit already exists. The app will function normally despite this warning. You can safely ignore it.

## 🛠️ Development Tips

### Hot Reload

```bash
# Terminal 1: Watch mode (rebuilds on changes)
npm run dev

# Terminal 2: Start Electron
npm start
```

### Debugging

**Main Process:**
- Add `console.log()` in `src/main/*.ts`
- Output appears in terminal

**Renderer Process:**
- Open DevTools: View → Toggle Developer Tools
- Use React DevTools extension
- `console.log()` appears in DevTools console

### Adding Dependencies

```bash
# Runtime dependency
npm install package-name

# Development dependency
npm install --save-dev package-name

# Rebuild after adding native modules
npm run rebuild
```

## 📝 Project Configuration

Each project has a `.insanusnote.config` file:

```json
{
  "name": "My Project",
  "path": "/path/to/project",
  "version": "1.0.0",
  "createdAt": 1706400000000,
  "updatedAt": 1706400000000,
  "notesPath": "notes",
  "interfacesPath": "interfaces",
  "dataPath": "data"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes
4. Build and test: `npm run build && npm start`
5. Commit: `git commit -m "Add my feature"`
6. Push: `git push origin feature/my-feature`
7. Open a Pull Request

## 📄 License

ISC License

## 🙏 Acknowledgments

Built with:
- [Electron](https://www.electronjs.org/) - Desktop framework
- [React](https://react.dev/) - UI library
- [TipTap](https://tiptap.dev/) - Rich text editor
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - SQLite bindings
- [Chokidar](https://github.com/paulmillr/chokidar) - File watching
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Webpack](https://webpack.js.org/) - Bundling

---

**Happy note-taking! 📝✨**

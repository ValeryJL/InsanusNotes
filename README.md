# InsanusNotes

A Linux-first, object-oriented note-taking and knowledge management app for programmers and world-builders. Built with Electron, React, TipTap, and SQLite.

## Features

### Core Concepts

- **Notes as Instances**: Each note is an instance with properties defined in Markdown with YAML frontmatter
- **Interfaces as Classes**: Define schemas with inheritance that validate note structure
- **Data (CSV) as Queryable Sources**: Import CSV files that can be referenced in notes
- **Real-time File System Indexing**: SQLite database automatically indexes your local filesystem

### Key Capabilities

- **Markdown Notes with Metadata**: Write notes in Markdown with YAML frontmatter for structured data
- **Interface-Based Validation**: Define interfaces that enforce schema constraints on notes
- **Note and Interface Inheritance**: Interfaces can extend other interfaces, inheriting and overriding properties
- **Dynamic Dot-Notation References**: Reference data across notes and CSV files using `[[Note.id.property]]` or `[[Data.source.row.column]]`
- **Rich Text Editor**: Powered by TipTap for an intuitive editing experience
- **Local-First**: All data stored locally in your filesystem and indexed in SQLite

## Technology Stack

- **Electron**: Cross-platform desktop application framework
- **React**: UI framework for the renderer process
- **TypeScript**: Type-safe development
- **TipTap**: Modern WYSIWYG editor built on ProseMirror
- **SQLite (better-sqlite3)**: Fast, embedded database for indexing
- **Chokidar**: File system watcher for real-time updates

## Installation

**Important:** After cloning or pulling updates, always run `npm install` to ensure all dependencies are installed.

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start the application
npm start
```

**Troubleshooting:** If you encounter build errors after pulling updates, see [SETUP.md](SETUP.md) for detailed troubleshooting steps.

## Development

```bash
# Watch mode for development
npm run dev

# In another terminal, start Electron
npm start
```

## Usage

### Quick Start with Examples

The `examples/` directory contains sample interfaces, notes, and data files demonstrating all key features. See [examples/README.md](examples/README.md) for details.

### Creating Notes

Notes are Markdown files with optional YAML frontmatter:

```markdown
---
interface: Character
name: John Doe
age: 30
class: Warrior
---

# John Doe

A brave warrior from the northern lands.

**Stats:**
- Strength: 18
- Dexterity: 14
- Intelligence: 10
```

### Defining Interfaces

Interfaces define schemas for notes. Create them in the `interfaces/` directory:

```markdown
# Interface: Character

Extends: Entity

## Schema

- name: string (required)
- age: number (required)
- class: string
- level: number
```

### Interface Inheritance

Interfaces can extend other interfaces:

```markdown
# Interface: Entity

## Schema

- id: string (required)
- createdAt: date (required)
- updatedAt: date
```

```markdown
# Interface: Character

Extends: Entity

## Schema

- name: string (required)
- class: string
```

### Using CSV Data

Place CSV files in the `data/` directory:

```csv
name,hp,mp,level
Fireball,0,50,3
Heal,30,20,1
Lightning,0,75,5
```

### Dynamic References

Reference data in your notes using dot notation:

- `[[Note.character-001.name]]` - Access a property from another note
- `[[Data.spells.0.name]]` - Access the first row, "name" column from spells.csv
- `[[Data.spells.2.mp]]` - Access the third row, "mp" column

## Project Structure

```
InsanusNotes/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.ts        # Application entry point
│   │   ├── preload.ts     # Preload script for IPC
│   │   ├── filesystem/    # File system watcher
│   │   ├── notes/         # Note management
│   │   ├── interfaces/    # Interface management
│   │   └── data/          # CSV data management
│   ├── renderer/          # React UI
│   │   ├── App.tsx        # Main application component
│   │   ├── components/    # React components
│   │   └── styles.css     # Application styles
│   ├── database/          # SQLite database
│   │   └── manager.ts     # Database initialization and management
│   └── shared/            # Shared types and utilities
├── webpack.config.js      # Webpack configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Project dependencies and scripts
```

## Architecture

### Main Process (Electron)

- **DatabaseManager**: Initializes and manages SQLite database
- **FileSystemWatcher**: Monitors filesystem for changes using Chokidar
- **NoteManager**: Handles note CRUD operations and validation
- **InterfaceManager**: Manages interfaces with inheritance support
- **DataManager**: Parses and indexes CSV files

### Renderer Process (React)

- **App**: Main application component with state management
- **NoteList**: Sidebar displaying all notes
- **NoteEditor**: TipTap-based Markdown editor

### IPC Communication

The preload script exposes a secure API for renderer-main communication:

- `api.notes.*` - Note operations
- `api.interfaces.*` - Interface operations
- `api.data.*` - CSV data queries
- `api.references.*` - Reference resolution

## Building for Distribution

```bash
# Build application for Linux
npm run package
```

The built application will be in the `build/` directory.

## License

ISC


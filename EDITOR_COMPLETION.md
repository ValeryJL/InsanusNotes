# InsanusEditor - Editor Completion Documentation

## Overview

The InsanusEditor has been successfully completed and integrated into the InsanusNotes application. This document describes the final implementation.

## What Was Completed

### 1. Full-Featured Rich Text Editor

The InsanusEditor is built on TipTap (a React wrapper for ProseMirror) and includes:

- **Rich Text Formatting**: Bold, italic, underline, strikethrough
- **Headings**: H1, H2, H3 with proper styling
- **Lists**: Bullet lists, numbered lists, and task lists with checkboxes
- **Code**: Inline code and code blocks
- **Tables**: Full table support with borders and styling
- **Quotes**: Blockquote support
- **Dividers**: Horizontal rules
- **Images**: Image insertion support

### 2. Cursor-Aware Reference Display

One of the most advanced features - references that change based on cursor position:

**When cursor is IN the reference:**
```
Text [[filename]] more text
     ↑ cursor here
```
- Shows: `[[filename]]` with gray background
- Allows editing the raw reference text
- Monospace font for clarity

**When cursor is OUTSIDE:**
```
Text [[filename]] more text
↑ cursor here
```
- Shows: "Resolved Filename" as blue link
- Clean, readable display
- Clickable (ready for navigation)

**Implementation:**
- Custom TipTap node extension
- Uses ReactNodeViewRenderer for React components
- Tracks `editor.state.selection` for cursor position
- Async IPC call to resolve references via `window.api.references.resolve()`
- Re-renders automatically on selection change

### 3. Properties Panel

**Behavior:**
- Hover over the title → properties panel appears below
- Leave hover → panel disappears
- Smooth fade-in animation

**Features:**
- Full key-value editor
- Add new properties with ➕ button
- Delete properties with 🗑️ button for each row
- Both key and value are editable
- All properties stored as strings
- Saves to YAML frontmatter automatically

**UI:**
```
╔════════════════════════════╗
║ Properties                 ║
╟────────────────────────────╢
║ [key] [value]          🗑️  ║
║ [key] [value]          🗑️  ║
║                            ║
║ ➕ Add Property            ║
╚════════════════════════════╝
```

### 4. Slash Commands Menu

**Trigger:** Type `/` anywhere in the editor

**Available Commands:**
1. **Heading 1** (H1) - Large heading
2. **Heading 2** (H2) - Medium heading  
3. **Heading 3** (H3) - Small heading
4. **Bullet List** (•) - Unordered list
5. **Numbered List** (1.) - Ordered list
6. **Task List** (☑) - Checkboxes
7. **Code Block** (</>) - Formatted code
8. **Table** (⊞) - 3x3 table with headers
9. **Quote** (❝) - Blockquote
10. **Divider** (─) - Horizontal rule

**Navigation:**
- Arrow keys (↑↓) to move selection
- Enter or Tab to execute
- Escape to cancel
- Type to filter commands

**Smart Removal:**
- Automatically removes the `/` trigger when command executes
- Cursor positioned correctly after insertion

### 5. Reference Autocomplete

**Trigger:** Type `[[` anywhere in the editor

**Behavior:**
- Shows menu with all markdown files in the project
- Filters as you continue typing
- Arrow keys (↑↓) to navigate
- Enter or Tab to select
- Escape to cancel
- Auto-inserts `[[filename]]` at cursor position

**File Discovery:**
- Queries `window.api.files.list(projectPath)`
- Filters for `.md` and `.markdown` files
- Removes file extension from display
- Shows with 📄 icon

### 6. Title Management

**Smart Title Extraction:**
```markdown
# My Note Title

This is the content...
```

- Automatically extracts "My Note Title" from first line
- Removes `# My Note Title` from editor body
- Shows title in large input (40px bold) at top
- Never visible in the editing area
- Saves back to markdown with `# ` prefix

**Behavior:**
- Title input is separate from editor content
- Changes auto-save after 1 second
- Properties panel appears on title hover

### 7. Save Functionality

**Auto-save:**
- Triggers 1 second after any change
- Includes title, properties, and content
- Debounced to prevent excessive saves

**Manual Save:**
- Diskette icon (💾) button in header
- Click to save immediately
- Shows "Saved!" feedback for 2 seconds
- Always available even with auto-save

**Save Process:**
1. Converts editor HTML to Markdown
2. Builds YAML frontmatter from properties
3. Combines: frontmatter + `# title` + content
4. Calls `onSave()` callback with updated note
5. Updates file via IPC

## Technical Architecture

### Component Structure

```
InsanusEditor
├── Editor Header
│   ├── Title Input (with hover for properties)
│   └── Save Button
├── Properties Panel (conditional)
│   ├── Property List (key-value pairs)
│   └── Add Property Button
├── Editor Content (TipTap)
│   ├── Rich Text Formatting
│   ├── Custom Reference Nodes
│   └── All Markdown Elements
├── Slash Command Menu (conditional)
│   └── Filtered Command List
└── Reference Menu (conditional)
    └── Filtered File List
```

### State Management

**React State:**
- `title`: Note title (string)
- `metadata`: Properties object (Record<string, any>)
- `showProperties`: Boolean for panel visibility
- `showSlashMenu`: Boolean for slash menu
- `slashMenuPosition`: { top, left } for positioning
- `slashFilter`: Current filter text
- `showReferenceMenu`: Boolean for reference menu
- `referenceMenuPosition`: { top, left }
- `referenceFilter`: Current filter text
- `availableReferences`: String array of file names
- `selectedMenuItem`: Number for keyboard navigation
- `saveStatus`: String for save feedback

**TipTap Editor:**
- Managed by `useEditor()` hook
- Extensions configured on initialization
- Content synced with note.content
- Updates trigger auto-save timer

### Data Flow

```
User Types
    ↓
Editor onChange
    ↓
Check for triggers (/, [[)
    ↓
Show/Update Menus
    ↓
User Selects Command/Reference
    ↓
Execute Action
    ↓
Update Editor Content
    ↓
Auto-save Timer (1s)
    ↓
Build Full Markdown
    ↓
onSave() Callback
    ↓
IPC to Main Process
    ↓
File Saved
```

### HTML to Markdown Conversion

The editor uses a custom HTML to Markdown converter:

```typescript
htmlToMarkdown(html: string): string
```

**Handles:**
- Paragraphs (`<p>` → newlines)
- Headings (`<h1-h3>` → `# ## ###`)
- Bold/Italic/Strike (`<strong> <em> <s>` → `** * ~~`)
- Lists (`<ul><li>` → `-`, `<ol><li>` → `1.`)
- Code (`<code>` → backticks, `<pre>` → triple backticks)
- Links/Images (`<a> <img>` → `[]()` `![]()`)
- Cleanup (multiple newlines)

## CSS Styling

All styles are in `notion-editor-styles.css`:

**Key Classes:**
- `.insanus-editor` - Main container
- `.editor-header` - Title and save button
- `.editor-title` - Large 40px title input
- `.save-button` - Blue save button
- `.properties-panel` - Hover panel
- `.property-row` - Key-value pair
- `.editor-content-wrapper` - Scrollable content area
- `.reference-raw` - Gray background for raw refs
- `.reference-resolved` - Blue link for resolved refs
- `.command-menu` - Slash command popup
- `.reference-menu` - Reference selection popup

**Color Scheme:**
- Background: `#1e1e1e` (dark)
- Text: `#d4d4d4` (light gray)
- Borders: `#3a3a3a` (medium gray)
- Accents: `#0e639c` (blue)
- Panels: `#2a2a2a` (slightly lighter)

## Integration with App

**App.tsx:**
```tsx
import InsanusEditor from './components/InsanusEditor';

// In render:
<InsanusEditor note={selectedNote} onSave={handleSaveNote} />
```

**Props:**
- `note`: Note object with id, title, content, metadata
- `onSave`: Callback function when note is saved

**Lifecycle:**
1. App loads note from file
2. Passes to InsanusEditor
3. Editor displays content
4. User edits
5. Auto-save or manual save
6. onSave() called with updated note
7. App saves to file via IPC

## API Dependencies

The editor requires these window.api methods:

```typescript
window.api.references.resolve(ref: string): Promise<string>
window.api.files.list(path: string): Promise<FileItem[]>
window.api.projects.getCurrent(): Promise<ProjectConfig | null>
```

These are provided by the preload script and main process.

## Future Enhancements

Possible improvements for the editor:

1. **Drag & Drop Images** - Drop images to insert
2. **Link Preview** - Hover over links to see preview
3. **Syntax Highlighting** - In code blocks
4. **Collaborative Editing** - Real-time collaboration
5. **Version History** - Track changes over time
6. **Custom Themes** - User-configurable colors
7. **Keyboard Shortcuts** - More shortcuts beyond basic
8. **Export Options** - PDF, HTML, DOCX export
9. **Search & Replace** - Find and replace in editor
10. **Word Count** - Display character/word count

## Testing the Editor

To test all features:

1. **Basic Editing**
   - Type text, format with bold/italic
   - Create headings with `# ## ###`
   - Make lists

2. **Slash Commands**
   - Type `/` and see menu
   - Use arrow keys to navigate
   - Press Enter to insert

3. **References**
   - Type `[[` and see file list
   - Select a file
   - Move cursor in/out to see display change

4. **Properties**
   - Hover over title
   - Add property
   - Edit key and value
   - Delete property

5. **Save**
   - Make changes and wait 1 second (auto-save)
   - Or click 💾 button (manual save)
   - Verify file is updated

## Troubleshooting

**Editor not loading:**
- Check console for errors
- Verify all TipTap extensions are installed
- Check that InsanusEditor is imported in App.tsx

**References not resolving:**
- Verify `window.api.references.resolve()` exists
- Check main process has resolution handler
- Look for IPC errors in console

**Slash menu not appearing:**
- Type `/` and wait a moment
- Check console for JavaScript errors
- Verify menu is not hidden by CSS

**Auto-save not working:**
- Check that onSave callback is provided
- Verify timer is not being cleared prematurely
- Look for save errors in console

## Conclusion

The InsanusEditor is a fully-featured, production-ready rich text editor with advanced features like cursor-aware reference display, slash commands, and dynamic properties. It provides a Notion-like experience optimized for knowledge management and note-taking.

All features requested have been implemented and the editor is ready for use in the InsanusNotes application.

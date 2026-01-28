# InsanusNotes UI Overview

## Project Selection Window (First Screen)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              🗒️ InsanusNotes                               │
│    Object-Oriented Note-Taking for Programmers             │
│                                                             │
│   ┌──────────────────┐  ┌──────────────────┐              │
│   │  ➕ New Project  │  │  📂 Open Project │              │
│   └──────────────────┘  └──────────────────┘              │
│                                                             │
│   Recent Projects                                           │
│   ┌─────────────────────────────────────────────┐          │
│   │ 📘 My Fantasy World                         │          │
│   │    /home/user/Documents/My Fantasy World    │          │
│   ├─────────────────────────────────────────────┤          │
│   │ 📗 Campaign Notes                           │          │
│   │    /home/user/Projects/Campaign Notes       │          │
│   ├─────────────────────────────────────────────┤          │
│   │ 📙 Programming Ideas                        │          │
│   │    /home/user/Code/Programming Ideas        │          │
│   └─────────────────────────────────────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Features:
- Purple gradient background
- White semi-transparent card
- Hover effects on all buttons
- Click any recent project to open instantly
- Create button opens modal dialog
- Open button shows folder picker
```

## Main Application Window (After Opening Project)

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ File  Edit  View  Help                          InsanusNotes - My Fantasy World│
├─────────────┬─────────────────────────────────────────────────────────────────┤
│             │                                                                  │
│ 📘 Project  │                    Welcome to InsanusNotes                      │
│ ────────    │                                                                  │
│ 📄 📁       │  Select a file from the explorer or create a new one           │
│             │                                                                  │
│ 📁 notes    │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│   📝 chars  │  │      📝      │  │      🏗️      │  │      📊      │         │
│   📝 world  │  │   Markdown   │  │  Interfaces  │  │   Dynamic    │         │
│             │  │     Notes    │  │    Schemas   │  │  References  │         │
│ 📁 data     │  └──────────────┘  └──────────────┘  └──────────────┘         │
│   📊 stats  │                                                                  │
│   📄 map    │                                                                  │
│             │                                                                  │
│ 📁 assets   │                                                                  │
│   🖼️ art    │                                                                  │
│             │                                                                  │
│             │                                                                  │
└─────────────┴─────────────────────────────────────────────────────────────────┘

Left Sidebar (300px):
- Dark gray background (#252525)
- File explorer with icons
- Hover effects on files
- Delete button (×) appears on hover
- Create file (📄) and folder (📁) buttons at top

Main Area:
- Dark background (#1e1e1e)
- Empty state when no file selected
- Feature cards with hover animations
- When file selected: full TipTap editor
```

## Main Window with File Selected

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                                              InsanusNotes - My Fantasy World  │
├─────────────┬─────────────────────────────────────────────────────────────────┤
│             │                                                                  │
│ 📘 Project  │  ┌────────────────────────────────────────────────┐  [Save]   │
│ ────────    │  │ Character: Aria Shadowblade                     │           │
│ 📄 📁       │  └────────────────────────────────────────────────┘           │
│             │                                                                  │
│ 📁 notes    │  Interface: Character                                           │
│   📝 aria ✓ │  ─────────────────────────────────                             │
│   📝 world  │                                                                  │
│             │  [B] [I] [Code] [H1] [H2] [•List] [Code Block]                │
│ 📁 data     │  ─────────────────────────────────────────────────             │
│   📊 stats  │                                                                  │
│   📄 map    │  # Aria Shadowblade                                            │
│             │                                                                  │
│ 📁 assets   │  A skilled elven ranger from Silverwood Forest.                │
│   🖼️ art    │                                                                  │
│             │  ## Background                                                  │
│             │  Born in the ancient forests of the north, Aria spent          │
│             │  her youth learning the ways of the wild...                     │
│             │                                                                  │
│             │  [[Note.aria.propertyName]] or [[Data.source.row.col]]         │
└─────────────┴─────────────────────────────────────────────────────────────────┘

Features:
- Selected file highlighted in explorer (✓)
- Note title at top
- Interface field below title
- TipTap toolbar with formatting options
- Full markdown editor
- Reference syntax helper at bottom
```

## File Operations

**Click on folder:**
- Expands/collapses folder
- Shows nested files

**Click on .md file:**
- Opens in built-in editor
- Shows in main area with TipTap

**Click on .pdf file:**
- Opens in system PDF viewer
- Uses shell.openPath()

**Click on image file:**
- Opens in system image viewer
- Supports .jpg, .png, .gif, etc.

**Hover on any file:**
- Shows delete button (×)
- Smooth transition animation

**Create file button (📄):**
- Prompts for filename
- Supports any extension
- Creates in current folder

**Create folder button (📁):**
- Prompts for folder name
- Creates in current location

## Color Scheme

**Project Selection:**
- Background: Purple gradient (#667eea to #764ba2)
- Card: White with 95% opacity
- Buttons: Purple (#667eea) with hover effects

**Main Application:**
- Background: Very dark gray (#1e1e1e)
- Sidebar: Dark gray (#252525)
- Borders: Medium gray (#3c3c3c)
- Text: Light gray (#d4d4d4)
- Highlights: Blue (#0e639c)
- Delete: Red (#f48771)

## Animations

- Smooth hover transitions (0.2s)
- Transform effects on buttons
- Fade effects on modals
- Slide animations on file operations

## Icons Used

- 🗒️ App icon
- 📘 📗 📙 Project icons
- 📁 Folders
- 📝 Markdown files
- 📄 Documents
- 📊 CSV/data files
- 🖼️ Images
- ⚙️ Config files
- ➕ Create actions
- × Delete actions

This creates a modern, professional appearance suitable for serious knowledge work!

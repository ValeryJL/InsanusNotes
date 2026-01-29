import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { FileSystemWatcher } from './filesystem/watcher';
import { DatabaseManager } from '../database/manager';
import { NoteManager } from './notes/manager';
import { InterfaceManager } from './interfaces/manager';
import { DataManager } from './data/manager';
import { ProjectManager } from './projects/manager';
import { FileManager } from './files/manager';

let projectSelectionWindow: BrowserWindow | null = null;
let mainWindow: BrowserWindow | null = null;
let dbManager: DatabaseManager;
let fileWatcher: FileSystemWatcher | null = null;
let noteManager: NoteManager;
let interfaceManager: InterfaceManager;
let dataManager: DataManager;
let projectManager: ProjectManager;
let fileManager: FileManager;

function createProjectSelectionWindow() {
  projectSelectionWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'InsanusNotes - Select Project'
  });

  projectSelectionWindow.loadFile(path.join(__dirname, 'renderer/project-selection.html'));

  projectSelectionWindow.on('closed', () => {
    projectSelectionWindow = null;
    // If no project was selected, quit the app
    if (!mainWindow) {
      app.quit();
    }
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function initializeProject(projectPath: string) {
  const project = projectManager.getCurrentProject();
  if (!project) {
    throw new Error('No project loaded');
  }

  const userDataPath = app.getPath('userData');
  const notesPath = projectManager.getProjectNotesPath();
  
  // Initialize database for this project
  const dbPath = path.join(project.path, '.insanusnotes.db');
  dbManager = new DatabaseManager(dbPath);
  await dbManager.initialize();

  // Initialize managers
  noteManager = new NoteManager(dbManager, notesPath);
  interfaceManager = new InterfaceManager(dbManager, projectManager.getProjectInterfacesPath());
  dataManager = new DataManager(dbManager, projectManager.getProjectDataPath());

  // Link managers to enable validation
  noteManager.setInterfaceManager(interfaceManager);

  // Initialize file system watcher
  if (fileWatcher) {
    fileWatcher.stop();
  }
  
  fileWatcher = new FileSystemWatcher(project.path, {
    onNoteChange: (filePath) => noteManager.handleFileChange(filePath),
    onInterfaceChange: (filePath) => interfaceManager.handleFileChange(filePath),
    onDataChange: (filePath) => dataManager.handleFileChange(filePath)
  });

  await fileWatcher.start();
}

// Suppress harmless console warnings
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('log-level', '3');

app.on('ready', async () => {
  const userDataPath = app.getPath('userData');
  projectManager = new ProjectManager(userDataPath);
  fileManager = new FileManager();

  // Show project selection window
  createProjectSelectionWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (!projectSelectionWindow && !mainWindow) {
    createProjectSelectionWindow();
  }
});

app.on('quit', () => {
  if (fileWatcher) {
    fileWatcher.stop();
  }
  if (dbManager) {
    dbManager.close();
  }
});

// Project IPC Handlers
ipcMain.handle('projects:create', async (_, name: string, projectPath: string) => {
  try {
    const project = await projectManager.createProject(name, projectPath);
    await initializeProject(project.path);
    
    // Close project selection window and open main window
    if (projectSelectionWindow) {
      projectSelectionWindow.close();
      projectSelectionWindow = null;
    }
    createMainWindow();
    
    return project;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
});

ipcMain.handle('projects:open', async (_, projectPath: string) => {
  try {
    const project = await projectManager.openProject(projectPath);
    await initializeProject(project.path);
    
    // Close project selection window and open main window
    if (projectSelectionWindow) {
      projectSelectionWindow.close();
      projectSelectionWindow = null;
    }
    createMainWindow();
    
    return project;
  } catch (error) {
    console.error('Error opening project:', error);
    throw error;
  }
});

ipcMain.handle('projects:getRecent', async () => {
  try {
    return await projectManager.getRecentProjects();
  } catch (error) {
    console.error('Error getting recent projects:', error);
    throw error;
  }
});

ipcMain.handle('projects:getCurrent', async () => {
  try {
    return projectManager.getCurrentProject();
  } catch (error) {
    console.error('Error getting current project:', error);
    throw error;
  }
});

ipcMain.handle('projects:selectFolder', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory']
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    
    return result.filePaths[0];
  } catch (error) {
    console.error('Error selecting folder:', error);
    throw error;
  }
});

// File IPC Handlers
ipcMain.handle('files:list', async (_, dirPath: string) => {
  try {
    return await fileManager.listFiles(dirPath);
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
});

ipcMain.handle('files:create', async (_, filePath: string, type: 'file' | 'directory') => {
  try {
    if (type === 'directory') {
      await fileManager.createDirectory(filePath);
    } else {
      await fileManager.createFile(filePath);
    }
  } catch (error) {
    console.error('Error creating file:', error);
    throw error;
  }
});

ipcMain.handle('files:delete', async (_, filePath: string) => {
  try {
    await fileManager.deleteFile(filePath);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
});

ipcMain.handle('files:rename', async (_, oldPath: string, newPath: string) => {
  try {
    await fileManager.renameFile(oldPath, newPath);
  } catch (error) {
    console.error('Error renaming file:', error);
    throw error;
  }
});

ipcMain.handle('files:openExternal', async (_, filePath: string) => {
  try {
    await fileManager.openExternal(filePath);
  } catch (error) {
    console.error('Error opening file externally:', error);
    throw error;
  }
});

// Note IPC Handlers
ipcMain.handle('notes:getAll', async () => {
  try {
    return await noteManager.getAllNotes();
  } catch (error) {
    console.error('Error getting all notes:', error);
    throw error;
  }
});

ipcMain.handle('notes:getById', async (_, id: string) => {
  try {
    return await noteManager.getNoteById(id);
  } catch (error) {
    console.error(`Error getting note ${id}:`, error);
    throw error;
  }
});

ipcMain.handle('notes:save', async (_, note: any) => {
  try {
    return await noteManager.saveNote(note);
  } catch (error) {
    console.error('Error saving note:', error);
    throw error;
  }
});

ipcMain.handle('notes:delete', async (_, id: string) => {
  try {
    return await noteManager.deleteNote(id);
  } catch (error) {
    console.error(`Error deleting note ${id}:`, error);
    throw error;
  }
});

ipcMain.handle('notes:resolve-reference', async (_, reference: string) => {
  try {
    // Parse reference: [[file]], [[file.property]], [[file.row.field]]
    const refMatch = reference.match(/^\[\[(.+?)\]\]$/);
    if (!refMatch) {
      return reference; // Not a valid reference, return as is
    }

    const parts = refMatch[1].split('.');
    
    if (parts.length === 1) {
      // Simple file reference: [[filename]]
      const fileName = parts[0];
      return fileName; // Return just the filename
    } else if (parts.length === 2) {
      // Property reference: [[file.property]] or CSV row: [[file.row]]
      const [fileName, propertyOrRow] = parts;
      
      // Try to get note property first
      try {
        const notes = await noteManager.getAllNotes();
        const note = notes.find(n => n.id === fileName || n.metadata?.name === fileName);
        if (note && note.metadata && propertyOrRow in note.metadata) {
          return String(note.metadata[propertyOrRow]);
        }
      } catch {}
      
      // Try CSV row (get first column)
      try {
        const csvData = await dataManager.queryData(fileName);
        const rowIndex = parseInt(propertyOrRow);
        if (!isNaN(rowIndex) && csvData && csvData[rowIndex]) {
          const firstKey = Object.keys(csvData[rowIndex])[0];
          return String(csvData[rowIndex][firstKey]);
        }
      } catch {}
      
      return `${fileName}.${propertyOrRow}`; // Fallback
    } else if (parts.length === 3) {
      // CSV field: [[file.row.field]]
      const [fileName, row, field] = parts;
      try {
        const csvData = await dataManager.queryData(fileName);
        const rowIndex = parseInt(row);
        if (!isNaN(rowIndex) && csvData && csvData[rowIndex] && field in csvData[rowIndex]) {
          return String(csvData[rowIndex][field]);
        }
      } catch {}
      
      return `${fileName}.${row}.${field}`; // Fallback
    }
    
    return reference;
  } catch (error) {
    console.error('Error resolving reference:', error);
    return reference; // Return original on error
  }
});

// Interface IPC Handlers
ipcMain.handle('interfaces:getAll', async () => {
  try {
    return await interfaceManager.getAllInterfaces();
  } catch (error) {
    console.error('Error getting all interfaces:', error);
    throw error;
  }
});

ipcMain.handle('interfaces:getById', async (_, id: string) => {
  try {
    return await interfaceManager.getInterfaceById(id);
  } catch (error) {
    console.error(`Error getting interface ${id}:`, error);
    throw error;
  }
});

// Data IPC Handlers
ipcMain.handle('data:query', async (_, dataId: string, row?: number, col?: string) => {
  try {
    return await dataManager.queryData(dataId, row, col);
  } catch (error) {
    console.error('Error querying data:', error);
    throw error;
  }
});

// Reference resolution IPC Handler
ipcMain.handle('references:resolve', async (_, reference: string) => {
  try {
    // Remove [[ and ]] if present
    const cleanRef = reference.replace(/^\[\[|\]\]$/g, '');
    const parts = cleanRef.split('.');

    // Case 1: [[filename]] - just the filename, return title
    if (parts.length === 1) {
      const noteId = parts[0];
      if (!noteId || typeof noteId !== 'string' || noteId.includes("'") || noteId.includes('"')) {
        console.warn('Invalid noteId in reference:', noteId);
        return noteId; // Return as-is if invalid
      }
      
      try {
        const note = await noteManager.getNoteById(noteId);
        // Return title from metadata or note title
        return note?.metadata?.title || note?.title || noteId;
      } catch (error) {
        // If note not found, return the filename as-is
        return noteId;
      }
    }
    
    // Case 2: [[filename.property]] - file with property
    if (parts.length === 2) {
      const noteId = parts[0];
      const prop = parts[1];
      
      if (!noteId || typeof noteId !== 'string' || noteId.includes("'") || noteId.includes('"')) {
        console.warn('Invalid noteId in reference:', noteId);
        return `${noteId}.${prop}`;
      }
      
      try {
        const note = await noteManager.getNoteById(noteId);
        const value = note?.metadata?.[prop];
        return value !== undefined ? String(value) : '';
      } catch (error) {
        return '';
      }
    }
    
    // Case 3: [[data.row]] or [[data.row.column]] - CSV data
    if (parts.length >= 3) {
      const dataId = parts[0];
      const rowStr = parts[1];
      const col = parts[2];
      
      // Try to parse row as number
      const row = parseInt(rowStr);
      if (isNaN(row)) {
        // Not a CSV reference, might be [[note.property.subproperty]]
        // For now, treat as note reference and get the first property
        try {
          const noteId = parts[0];
          const prop = parts[1];
          const note = await noteManager.getNoteById(noteId);
          const value = note?.metadata?.[prop];
          return value !== undefined ? String(value) : '';
        } catch (error) {
          return '';
        }
      }
      
      // It's a CSV reference
      try {
        if (col) {
          // [[data.row.column]] - specific cell
          return await dataManager.queryData(dataId, row, col);
        } else {
          // [[data.row]] - first column of row (column index 0)
          return await dataManager.queryData(dataId, row, '0');
        }
      } catch (error) {
        console.error('Error querying CSV data:', error);
        return '';
      }
    }

    return reference; // Fallback to original reference
  } catch (error) {
    console.error('Error resolving reference:', error);
    return reference; // Return original on error
  }
});

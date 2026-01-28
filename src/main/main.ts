import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { FileSystemWatcher } from './filesystem/watcher';
import { DatabaseManager } from '../database/manager';
import { NoteManager } from './notes/manager';
import { InterfaceManager } from './interfaces/manager';
import { DataManager } from './data/manager';

let mainWindow: BrowserWindow | null = null;
let dbManager: DatabaseManager;
let fileWatcher: FileSystemWatcher;
let noteManager: NoteManager;
let interfaceManager: InterfaceManager;
let dataManager: DataManager;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // In production, load the built index.html
  // In development, this would connect to webpack-dev-server
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function initializeApp() {
  const userDataPath = app.getPath('userData');
  const notesPath = path.join(userDataPath, 'notes');
  
  // Initialize database
  dbManager = new DatabaseManager(path.join(userDataPath, 'insanus.db'));
  await dbManager.initialize();

  // Initialize managers
  noteManager = new NoteManager(dbManager, notesPath);
  interfaceManager = new InterfaceManager(dbManager, notesPath);
  dataManager = new DataManager(dbManager, notesPath);

  // Initialize file system watcher
  fileWatcher = new FileSystemWatcher(notesPath, {
    onNoteChange: (filePath) => noteManager.handleFileChange(filePath),
    onInterfaceChange: (filePath) => interfaceManager.handleFileChange(filePath),
    onDataChange: (filePath) => dataManager.handleFileChange(filePath)
  });

  await fileWatcher.start();
}

app.on('ready', async () => {
  await initializeApp();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
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

// IPC Handlers
ipcMain.handle('notes:getAll', async () => {
  return await noteManager.getAllNotes();
});

ipcMain.handle('notes:getById', async (_, id: string) => {
  return await noteManager.getNoteById(id);
});

ipcMain.handle('notes:save', async (_, note: any) => {
  return await noteManager.saveNote(note);
});

ipcMain.handle('notes:delete', async (_, id: string) => {
  return await noteManager.deleteNote(id);
});

ipcMain.handle('interfaces:getAll', async () => {
  return await interfaceManager.getAllInterfaces();
});

ipcMain.handle('interfaces:getById', async (_, id: string) => {
  return await interfaceManager.getInterfaceById(id);
});

ipcMain.handle('data:query', async (_, dataId: string, row?: number, col?: string) => {
  return await dataManager.queryData(dataId, row, col);
});

ipcMain.handle('references:resolve', async (_, reference: string) => {
  // Parse and resolve [[Note.prop]] or [[Data.row.col]] references
  const match = reference.match(/\[\[(.+?)\]\]/);
  if (!match) return null;

  const parts = match[1].split('.');
  const type = parts[0];

  if (type === 'Note') {
    const noteId = parts[1];
    const prop = parts[2];
    const note = await noteManager.getNoteById(noteId);
    return note?.metadata?.[prop];
  } else if (type === 'Data') {
    const dataId = parts[1];
    const row = parseInt(parts[2]);
    const col = parts[3];
    return await dataManager.queryData(dataId, row, col);
  }

  return null;
});

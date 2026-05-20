const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

function createWindow() {
  // Crear la ventana del navegador
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "MemoSpace",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Ocultar el menú superior para una apariencia más premium y nativa
  mainWindow.removeMenu();

  // Cargar el index.html local
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Interceptar la apertura de nuevas ventanas/pestañas (target="_blank" o window.open)
  // y abrirlas en el navegador predeterminado del sistema operativo.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Solo abrir externamente si no es un archivo local del propio proyecto
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
}

// Inicializar la aplicación cuando Electron esté listo
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Salir cuando todas las ventanas se cierren (excepto en macOS)
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

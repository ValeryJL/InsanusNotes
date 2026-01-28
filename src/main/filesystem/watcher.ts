import * as chokidar from 'chokidar';
import * as path from 'path';
import * as fs from 'fs';

interface WatcherCallbacks {
  onNoteChange: (filePath: string) => void;
  onInterfaceChange: (filePath: string) => void;
  onDataChange: (filePath: string) => void;
}

export class FileSystemWatcher {
  private watcher: chokidar.FSWatcher | null = null;

  constructor(
    private watchPath: string,
    private callbacks: WatcherCallbacks
  ) {
    // Ensure watch directory exists
    if (!fs.existsSync(watchPath)) {
      fs.mkdirSync(watchPath, { recursive: true });
    }
  }

  async start() {
    this.watcher = chokidar.watch(this.watchPath, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: false
    });

    this.watcher
      .on('add', (filePath) => this.handleFileEvent(filePath, 'add'))
      .on('change', (filePath) => this.handleFileEvent(filePath, 'change'))
      .on('unlink', (filePath) => this.handleFileEvent(filePath, 'unlink'));
  }

  private handleFileEvent(filePath: string, event: string) {
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.md') {
      // Check if it's an interface or note based on file content or location
      const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
      if (content.includes('# Interface:') || filePath.includes('/interfaces/')) {
        this.callbacks.onInterfaceChange(filePath);
      } else {
        this.callbacks.onNoteChange(filePath);
      }
    } else if (ext === '.csv') {
      this.callbacks.onDataChange(filePath);
    }
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}

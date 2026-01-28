import * as fs from 'fs';
import * as path from 'path';
import { FileItem } from '../../shared/types';
import { shell } from 'electron';

export class FileManager {
  async listFiles(dirPath: string): Promise<FileItem[]> {
    if (!fs.existsSync(dirPath)) {
      return [];
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const files: FileItem[]= [];

    for (const entry of entries) {
      // Skip hidden files
      if (entry.name.startsWith('.')) continue;

      const fullPath = path.join(dirPath, entry.name);
      const stats = fs.statSync(fullPath);

      files.push({
        name: entry.name,
        path: fullPath,
        type: entry.isDirectory() ? 'directory' : 'file',
        extension: entry.isFile() ? path.extname(entry.name) : undefined,
        size: stats.size,
        modifiedAt: stats.mtimeMs
      });
    }

    // Sort: directories first, then files alphabetically
    return files.sort((a, b) => {
      if (a.type === 'directory' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name);
    });
  }

  async createFile(filePath: string): Promise<void> {
    try {
      const dir = path.dirname(filePath);
      
      // Ensure parent directory exists
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Create empty file
      fs.writeFileSync(filePath, '', 'utf-8');
      console.log('File created successfully:', filePath);
    } catch (error) {
      console.error('Error creating file:', filePath, error);
      throw new Error(`Failed to create file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createDirectory(dirPath: string): Promise<void> {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log('Directory created successfully:', dirPath);
      } else {
        console.log('Directory already exists:', dirPath);
      }
    } catch (error) {
      console.error('Error creating directory:', dirPath, error);
      throw new Error(`Failed to create directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      fs.rmSync(filePath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(filePath);
    }
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    if (!fs.existsSync(oldPath)) {
      throw new Error(`File not found: ${oldPath}`);
    }

    const newDir = path.dirname(newPath);
    if (!fs.existsSync(newDir)) {
      fs.mkdirSync(newDir, { recursive: true });
    }

    fs.renameSync(oldPath, newPath);
  }

  async openExternal(filePath: string): Promise<void> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Use shell.openPath to open with default application
    const result = await shell.openPath(filePath);
    
    if (result) {
      throw new Error(`Failed to open file: ${result}`);
    }
  }

  getFileExtension(filePath: string): string {
    return path.extname(filePath).toLowerCase();
  }

  isMarkdownFile(filePath: string): boolean {
    const ext = this.getFileExtension(filePath);
    return ext === '.md' || ext === '.markdown';
  }
}

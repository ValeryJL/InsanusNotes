import * as fs from 'fs';
import * as path from 'path';
import { DatabaseManager } from '../../database/manager';
import { Note, InterfaceSchema } from '../../shared/types';

export class NoteManager {
  private interfaceManager?: any;

  constructor(
    private dbManager: DatabaseManager,
    private notesPath: string
  ) {
    if (!fs.existsSync(notesPath)) {
      fs.mkdirSync(notesPath, { recursive: true });
    }
  }

  setInterfaceManager(manager: any) {
    this.interfaceManager = manager;
  }

  async handleFileChange(filePath: string) {
    if (!fs.existsSync(filePath)) {
      // File was deleted
      await this.deleteNoteByPath(filePath);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const note = this.parseMarkdownNote(content, filePath);
    await this.saveNoteToDb(note);
  }

  private parseMarkdownNote(content: string, filePath: string): Note {
    const lines = content.split('\n');
    const metadata: Record<string, any> = {};
    let title = '';
    let bodyContent = '';
    let inFrontmatter = false;
    let frontmatterEnd = 0;

    // Parse YAML frontmatter
    if (lines[0]?.trim() === '---') {
      inFrontmatter = true;
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '---') {
          frontmatterEnd = i + 1;
          break;
        }
        const match = lines[i].match(/^(\w+):\s*(.+)$/);
        if (match) {
          const [, key, value] = match;
          metadata[key] = value.trim();
        }
      }
    }

    // Extract title (first # heading or from metadata)
    const titleLine = lines.slice(frontmatterEnd).find(l => l.startsWith('# '));
    title = titleLine ? titleLine.replace(/^#\s+/, '') : (metadata.title || path.basename(filePath, '.md'));

    // Get body content
    bodyContent = lines.slice(frontmatterEnd).join('\n');

    const id = path.basename(filePath, '.md');
    const now = Date.now();

    return {
      id,
      title,
      content: bodyContent,
      metadata,
      interfaceId: metadata.interface,
      filePath,
      createdAt: metadata.createdAt || now,
      updatedAt: now
    };
  }

  private async saveNoteToDb(note: Note) {
    const db = this.dbManager.getDb();
    
    // Validate against interface if specified
    if (note.interfaceId && this.interfaceManager) {
      const isValid = await this.interfaceManager.validateNote(note);
      if (!isValid) {
        console.warn(`Note ${note.id} does not conform to interface ${note.interfaceId}`);
      }
    }

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO notes (id, title, content, metadata, interface_id, file_path, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      note.id,
      note.title,
      note.content,
      JSON.stringify(note.metadata),
      note.interfaceId || null,
      note.filePath,
      note.createdAt,
      note.updatedAt
    );
  }

  async getAllNotes(): Promise<Note[]> {
    const db = this.dbManager.getDb();
    const stmt = db.prepare('SELECT * FROM notes ORDER BY updated_at DESC');
    const rows = stmt.all() as any[];

    return rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      metadata: JSON.parse(row.metadata || '{}'),
      interfaceId: row.interface_id,
      filePath: row.file_path,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async getNoteById(id: string): Promise<Note | null> {
    const db = this.dbManager.getDb();
    const stmt = db.prepare('SELECT * FROM notes WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    return {
      id: row.id,
      title: row.title,
      content: row.content,
      metadata: JSON.parse(row.metadata || '{}'),
      interfaceId: row.interface_id,
      filePath: row.file_path,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async saveNote(note: Note): Promise<void> {
    // Save to file system
    const filePath = note.filePath || path.join(this.notesPath, `${note.id}.md`);
    const content = this.serializeNote(note);
    fs.writeFileSync(filePath, content, 'utf-8');
    
    // Will be indexed by file watcher
  }

  private serializeNote(note: Note): string {
    let content = '---\n';
    for (const [key, value] of Object.entries(note.metadata)) {
      content += `${key}: ${value}\n`;
    }
    content += '---\n\n';
    content += `# ${note.title}\n\n`;
    content += note.content;
    return content;
  }

  async deleteNote(id: string): Promise<void> {
    const note = await this.getNoteById(id);
    if (!note) return;

    // Delete file
    if (fs.existsSync(note.filePath)) {
      fs.unlinkSync(note.filePath);
    }

    // Delete from database
    const db = this.dbManager.getDb();
    const stmt = db.prepare('DELETE FROM notes WHERE id = ?');
    stmt.run(id);
  }

  private async deleteNoteByPath(filePath: string) {
    const db = this.dbManager.getDb();
    const stmt = db.prepare('DELETE FROM notes WHERE file_path = ?');
    stmt.run(filePath);
  }
}

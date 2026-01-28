import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

export class DatabaseManager {
  private db: Database.Database;

  constructor(private dbPath: string) {
    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    this.db = new Database(dbPath);
  }

  async initialize() {
    // Create notes table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        metadata TEXT,
        interface_id TEXT,
        file_path TEXT UNIQUE,
        created_at INTEGER,
        updated_at INTEGER
      )
    `);

    // Create interfaces table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS interfaces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        schema TEXT,
        parent_id TEXT,
        file_path TEXT UNIQUE,
        created_at INTEGER,
        updated_at INTEGER,
        FOREIGN KEY (parent_id) REFERENCES interfaces(id)
      )
    `);

    // Create data_sources table for CSV files
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS data_sources (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        file_path TEXT UNIQUE,
        headers TEXT,
        row_count INTEGER,
        created_at INTEGER,
        updated_at INTEGER
      )
    `);

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_notes_interface ON notes(interface_id);
      CREATE INDEX IF NOT EXISTS idx_interfaces_parent ON interfaces(parent_id);
      CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at);
    `);
  }

  getDb(): Database.Database {
    return this.db;
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

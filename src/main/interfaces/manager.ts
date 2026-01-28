import * as fs from 'fs';
import * as path from 'path';
import { DatabaseManager } from '../../database/manager';
import { Note } from '../notes/manager';

export interface InterfaceSchema {
  properties: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'date';
    required?: boolean;
    default?: any;
  }>;
}

export interface Interface {
  id: string;
  name: string;
  schema: InterfaceSchema;
  parentId?: string;
  filePath: string;
  createdAt: number;
  updatedAt: number;
}

export class InterfaceManager {
  constructor(
    private dbManager: DatabaseManager,
    private notesPath: string
  ) {
    const interfacesPath = path.join(notesPath, 'interfaces');
    if (!fs.existsSync(interfacesPath)) {
      fs.mkdirSync(interfacesPath, { recursive: true });
    }
  }

  async handleFileChange(filePath: string) {
    if (!fs.existsSync(filePath)) {
      await this.deleteInterfaceByPath(filePath);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const interfaceObj = this.parseInterface(content, filePath);
    await this.saveInterfaceToDb(interfaceObj);
  }

  private parseInterface(content: string, filePath: string): Interface {
    const lines = content.split('\n');
    const schema: InterfaceSchema = { properties: {} };
    let name = '';
    let parentId: string | undefined;
    let inSchema = false;

    for (const line of lines) {
      // Parse interface name
      if (line.startsWith('# Interface:')) {
        name = line.replace('# Interface:', '').trim();
      }
      // Parse inheritance
      else if (line.startsWith('Extends:')) {
        parentId = line.replace('Extends:', '').trim();
      }
      // Parse schema section
      else if (line.startsWith('## Schema')) {
        inSchema = true;
      }
      // Parse properties
      else if (inSchema && line.startsWith('- ')) {
        const match = line.match(/^- (\w+):\s*(\w+)(?:\s*\((.+)\))?/);
        if (match) {
          const [, propName, propType, options] = match;
          schema.properties[propName] = {
            type: propType as any,
            required: options?.includes('required') || false
          };
        }
      }
    }

    const id = path.basename(filePath, '.md');
    const now = Date.now();

    return {
      id,
      name: name || id,
      schema,
      parentId,
      filePath,
      createdAt: now,
      updatedAt: now
    };
  }

  private async saveInterfaceToDb(interfaceObj: Interface) {
    const db = this.dbManager.getDb();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO interfaces (id, name, schema, parent_id, file_path, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      interfaceObj.id,
      interfaceObj.name,
      JSON.stringify(interfaceObj.schema),
      interfaceObj.parentId || null,
      interfaceObj.filePath,
      interfaceObj.createdAt,
      interfaceObj.updatedAt
    );
  }

  async getAllInterfaces(): Promise<Interface[]> {
    const db = this.dbManager.getDb();
    const stmt = db.prepare('SELECT * FROM interfaces ORDER BY name');
    const rows = stmt.all() as any[];

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      schema: JSON.parse(row.schema),
      parentId: row.parent_id,
      filePath: row.file_path,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async getInterfaceById(id: string): Promise<Interface | null> {
    const db = this.dbManager.getDb();
    const stmt = db.prepare('SELECT * FROM interfaces WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      schema: JSON.parse(row.schema),
      parentId: row.parent_id,
      filePath: row.file_path,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private async getInheritedSchema(interfaceId: string): Promise<InterfaceSchema> {
    const interfaceObj = await this.getInterfaceById(interfaceId);
    if (!interfaceObj) {
      return { properties: {} };
    }

    let mergedSchema: InterfaceSchema = { properties: {} };

    // Get parent schema first (recursively)
    if (interfaceObj.parentId) {
      mergedSchema = await this.getInheritedSchema(interfaceObj.parentId);
    }

    // Merge with current schema (current overrides parent)
    mergedSchema.properties = {
      ...mergedSchema.properties,
      ...interfaceObj.schema.properties
    };

    return mergedSchema;
  }

  async validateNote(note: Note): Promise<boolean> {
    if (!note.interfaceId) return true;

    const schema = await this.getInheritedSchema(note.interfaceId);
    
    // Check required properties
    for (const [propName, propDef] of Object.entries(schema.properties)) {
      if (propDef.required && !(propName in note.metadata)) {
        console.warn(`Missing required property: ${propName}`);
        return false;
      }

      // Basic type checking
      if (propName in note.metadata) {
        const value = note.metadata[propName];
        const actualType = typeof value;
        
        if (propDef.type === 'number' && actualType !== 'number') {
          console.warn(`Property ${propName} should be a number`);
          return false;
        }
        if (propDef.type === 'boolean' && actualType !== 'boolean') {
          console.warn(`Property ${propName} should be a boolean`);
          return false;
        }
      }
    }

    return true;
  }

  private async deleteInterfaceByPath(filePath: string) {
    const db = this.dbManager.getDb();
    const stmt = db.prepare('DELETE FROM interfaces WHERE file_path = ?');
    stmt.run(filePath);
  }
}

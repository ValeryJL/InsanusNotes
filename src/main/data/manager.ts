import * as fs from 'fs';
import * as path from 'path';
import { DatabaseManager } from '../../database/manager';
import { DataSource } from '../../shared/types';

export class DataManager {
  private csvCache: Map<string, string[][]> = new Map();

  constructor(
    private dbManager: DatabaseManager,
    private notesPath: string
  ) {
    const dataPath = path.join(notesPath, 'data');
    if (!fs.existsSync(dataPath)) {
      fs.mkdirSync(dataPath, { recursive: true });
    }
  }

  async handleFileChange(filePath: string) {
    if (!fs.existsSync(filePath)) {
      await this.deleteDataByPath(filePath);
      this.csvCache.delete(filePath);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const data = this.parseCSV(content);
    const dataSource = this.createDataSource(filePath, data);
    await this.saveDataSourceToDb(dataSource);
    this.csvCache.set(filePath, data);
  }

  private parseCSV(content: string): string[][] {
    const lines = content.split('\n').filter(line => line.trim());
    return lines.map(line => {
      // Simple CSV parsing (doesn't handle quotes/escapes fully)
      return line.split(',').map(cell => cell.trim());
    });
  }

  private createDataSource(filePath: string, data: string[][]): DataSource {
    const id = path.basename(filePath, '.csv');
    const headers = data[0] || [];
    const rowCount = data.length - 1;
    const now = Date.now();

    return {
      id,
      name: id,
      filePath,
      headers,
      rowCount,
      createdAt: now,
      updatedAt: now
    };
  }

  private async saveDataSourceToDb(dataSource: DataSource) {
    const db = this.dbManager.getDb();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO data_sources (id, name, file_path, headers, row_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      dataSource.id,
      dataSource.name,
      dataSource.filePath,
      JSON.stringify(dataSource.headers),
      dataSource.rowCount,
      dataSource.createdAt,
      dataSource.updatedAt
    );
  }

  async queryData(dataId: string, row?: number, col?: string): Promise<any> {
    const db = this.dbManager.getDb();
    const stmt = db.prepare('SELECT * FROM data_sources WHERE id = ?');
    const dataSource = stmt.get(dataId) as any;

    if (!dataSource) return null;

    // Load CSV data
    let csvData = this.csvCache.get(dataSource.file_path);
    if (!csvData) {
      if (!fs.existsSync(dataSource.file_path)) return null;
      const content = fs.readFileSync(dataSource.file_path, 'utf-8');
      csvData = this.parseCSV(content);
      this.csvCache.set(dataSource.file_path, csvData);
    }

    const headers = JSON.parse(dataSource.headers);

    // If no row/col specified, return full data
    if (row === undefined && col === undefined) {
      return {
        headers,
        rows: csvData.slice(1)
      };
    }

    // If only row specified, return full row
    if (row !== undefined && col === undefined) {
      const rowData = csvData[row + 1]; // +1 to skip header
      if (!rowData) return null;
      
      const result: Record<string, string> = {};
      headers.forEach((header: string, i: number) => {
        result[header] = rowData[i];
      });
      return result;
    }

    // If row and col specified, return specific cell
    if (row !== undefined && col !== undefined) {
      const rowData = csvData[row + 1];
      if (!rowData) return null;
      
      const colIndex = headers.indexOf(col);
      if (colIndex === -1) return null;
      
      return rowData[colIndex];
    }

    return null;
  }

  private async deleteDataByPath(filePath: string) {
    const db = this.dbManager.getDb();
    const stmt = db.prepare('DELETE FROM data_sources WHERE file_path = ?');
    stmt.run(filePath);
  }
}

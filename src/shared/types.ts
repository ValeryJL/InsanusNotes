export interface Note {
  id: string;
  title: string;
  content: string;
  metadata: Record<string, any>;
  interfaceId?: string;
  filePath: string;
  createdAt: number;
  updatedAt: number;
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

export interface InterfaceSchema {
  properties: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'date';
    required?: boolean;
    default?: any;
  }>;
}

export interface DataSource {
  id: string;
  name: string;
  filePath: string;
  headers: string[];
  rowCount: number;
  createdAt: number;
  updatedAt: number;
}

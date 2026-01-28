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

// Window API type declaration for renderer process
export interface InsanusAPI {
  notes: {
    getAll: () => Promise<Note[]>;
    getById: (id: string) => Promise<Note | null>;
    save: (note: Note) => Promise<void>;
    delete: (id: string) => Promise<void>;
  };
  interfaces: {
    getAll: () => Promise<Interface[]>;
    getById: (id: string) => Promise<Interface | null>;
  };
  data: {
    query: (dataId: string, row?: number, col?: string) => Promise<any>;
  };
  references: {
    resolve: (reference: string) => Promise<any>;
  };
}

declare global {
  interface Window {
    api: InsanusAPI;
  }
}

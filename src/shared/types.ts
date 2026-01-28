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

export interface ProjectConfig {
  name: string;
  path: string;
  version: string;
  createdAt: number;
  updatedAt: number;
  description?: string;
  author?: string;
  notesPath?: string;
  interfacesPath?: string;
  dataPath?: string;
}

export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  size?: number;
  modifiedAt?: number;
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
  projects: {
    create: (name: string, path: string) => Promise<ProjectConfig>;
    open: (path: string) => Promise<ProjectConfig>;
    getRecent: () => Promise<ProjectConfig[]>;
    getCurrent: () => Promise<ProjectConfig | null>;
  };
  files: {
    list: (dirPath: string) => Promise<FileItem[]>;
    create: (filePath: string, type: 'file' | 'directory') => Promise<void>;
    delete: (filePath: string) => Promise<void>;
    rename: (oldPath: string, newPath: string) => Promise<void>;
    openExternal: (filePath: string) => Promise<void>;
  };
}

declare global {
  interface Window {
    api: InsanusAPI;
  }
}

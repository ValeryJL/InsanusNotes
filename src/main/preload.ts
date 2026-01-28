import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  notes: {
    getAll: () => ipcRenderer.invoke('notes:getAll'),
    getById: (id: string) => ipcRenderer.invoke('notes:getById', id),
    save: (note: any) => ipcRenderer.invoke('notes:save', note),
    delete: (id: string) => ipcRenderer.invoke('notes:delete', id)
  },
  interfaces: {
    getAll: () => ipcRenderer.invoke('interfaces:getAll'),
    getById: (id: string) => ipcRenderer.invoke('interfaces:getById', id)
  },
  data: {
    query: (dataId: string, row?: number, col?: string) => 
      ipcRenderer.invoke('data:query', dataId, row, col)
  },
  references: {
    resolve: (reference: string) => ipcRenderer.invoke('references:resolve', reference)
  },
  projects: {
    create: (name: string, path: string) => ipcRenderer.invoke('projects:create', name, path),
    open: (path: string) => ipcRenderer.invoke('projects:open', path),
    getRecent: () => ipcRenderer.invoke('projects:getRecent'),
    getCurrent: () => ipcRenderer.invoke('projects:getCurrent'),
    selectFolder: () => ipcRenderer.invoke('projects:selectFolder')
  },
  files: {
    list: (dirPath: string) => ipcRenderer.invoke('files:list', dirPath),
    create: (filePath: string, type: 'file' | 'directory') => 
      ipcRenderer.invoke('files:create', filePath, type),
    delete: (filePath: string) => ipcRenderer.invoke('files:delete', filePath),
    rename: (oldPath: string, newPath: string) => 
      ipcRenderer.invoke('files:rename', oldPath, newPath),
    openExternal: (filePath: string) => ipcRenderer.invoke('files:openExternal', filePath)
  }
});

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
  }
});

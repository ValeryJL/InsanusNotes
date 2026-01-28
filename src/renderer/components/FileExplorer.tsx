import React, { useState, useEffect } from 'react';
import { FileItem, ProjectConfig } from '../../shared/types';

interface FileExplorerProps {
  onFileSelect: (file: FileItem) => void;
}

interface DialogState {
  type: 'file' | 'folder' | 'delete' | null;
  fileToDelete?: FileItem;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ onFileSelect }) => {
  const [project, setProject] = useState<ProjectConfig | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [dialogState, setDialogState] = useState<DialogState>({ type: null });
  const [inputValue, setInputValue] = useState<string>('');

  useEffect(() => {
    loadProject();
  }, []);

  useEffect(() => {
    if (currentPath) {
      loadFiles(currentPath);
    }
  }, [currentPath]);

  const loadProject = async () => {
    try {
      const proj = await window.api.projects.getCurrent();
      console.log('Loaded project:', proj);
      if (proj) {
        setProject(proj);
        setCurrentPath(proj.path);
        console.log('Current path set to:', proj.path);
      } else {
        console.warn('No project loaded');
      }
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  };

  const loadFiles = async (path: string) => {
    try {
      console.log('Loading files from:', path);
      const fileList = await window.api.files.list(path);
      console.log('Files loaded:', fileList.length, 'items');
      setFiles(fileList);
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  const handleFileClick = async (file: FileItem) => {
    if (file.type === 'directory') {
      const isExpanded = expandedFolders.has(file.path);
      const newExpanded = new Set(expandedFolders);
      
      if (isExpanded) {
        newExpanded.delete(file.path);
      } else {
        newExpanded.add(file.path);
      }
      
      setExpandedFolders(newExpanded);
      setCurrentPath(file.path);
    } else {
      // Check if it's a markdown file
      if (file.extension === '.md' || file.extension === '.markdown') {
        onFileSelect(file);
      } else {
        // Open with default app
        try {
          await window.api.files.openExternal(file.path);
        } catch (error) {
          console.error('Failed to open file:', error);
        }
      }
    }
  };

  const handleCreateFile = () => {
    if (!currentPath) {
      setDialogState({ type: null });
      // Show error in dialog instead
      return;
    }
    setInputValue('');
    setDialogState({ type: 'file' });
  };

  const handleCreateFolder = () => {
    if (!currentPath) {
      setDialogState({ type: null });
      // Show error in dialog instead
      return;
    }
    setInputValue('');
    setDialogState({ type: 'folder' });
  };

  const handleDeleteFile = (file: FileItem, event: React.MouseEvent) => {
    event.stopPropagation();
    setDialogState({ type: 'delete', fileToDelete: file });
  };

  const confirmCreate = async () => {
    if (!inputValue.trim()) return;

    try {
      if (!currentPath) {
        return;
      }

      const itemPath = `${currentPath}/${inputValue.trim()}`;
      
      if (dialogState.type === 'file') {
        console.log('Creating file:', itemPath);
        await window.api.files.create(itemPath, 'file');
        console.log('File created successfully');
      } else if (dialogState.type === 'folder') {
        console.log('Creating folder:', itemPath);
        await window.api.files.create(itemPath, 'directory');
        console.log('Folder created successfully');
      }
      
      await loadFiles(currentPath);
      setDialogState({ type: null });
      setInputValue('');
    } catch (error) {
      console.error('Failed to create:', error);
      // Keep dialog open to show error
    }
  };

  const confirmDelete = async () => {
    if (!dialogState.fileToDelete) return;

    try {
      await window.api.files.delete(dialogState.fileToDelete.path);
      await loadFiles(currentPath);
      setDialogState({ type: null });
    } catch (error) {
      console.error('Failed to delete file:', error);
      setDialogState({ type: null });
    }
  };

  const cancelDialog = () => {
    setDialogState({ type: null });
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      confirmCreate();
    } else if (e.key === 'Escape') {
      cancelDialog();
    }
  };

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'directory') return '📁';
    
    switch (file.extension) {
      case '.md':
      case '.markdown':
        return '📝';
      case '.pdf':
        return '📄';
      case '.csv':
        return '📊';
      case '.json':
        return '⚙️';
      case '.jpg':
      case '.jpeg':
      case '.png':
      case '.gif':
        return '🖼️';
      default:
        return '📄';
    }
  };

  return (
    <div className="file-explorer">
      <div className="file-explorer-header">
        <h3>{project?.name || 'Project'}</h3>
        <div className="file-explorer-actions">
          <button onClick={handleCreateFile} title="New File">📄</button>
          <button onClick={handleCreateFolder} title="New Folder">📁</button>
        </div>
      </div>
      
      <div className="file-list">
        {files.map(file => (
          <div
            key={file.path}
            className={`file-item ${file.type}`}
            onClick={() => handleFileClick(file)}
          >
            <span className="file-icon">{getFileIcon(file)}</span>
            <span className="file-name">{file.name}</span>
            <button
              className="file-delete"
              onClick={(e) => handleDeleteFile(file, e)}
              title="Delete"
            >
              ×
            </button>
          </div>
        ))}
        
        {files.length === 0 && (
          <div className="empty-folder">Empty folder</div>
        )}
      </div>

      {/* Create File/Folder Dialog */}
      {(dialogState.type === 'file' || dialogState.type === 'folder') && (
        <div className="dialog-overlay" onClick={cancelDialog}>
          <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
            <h3>{dialogState.type === 'file' ? 'Create New File' : 'Create New Folder'}</h3>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={dialogState.type === 'file' ? 'filename.md' : 'folder-name'}
              autoFocus
            />
            <div className="dialog-buttons">
              <button onClick={confirmCreate} className="dialog-btn-primary">Create</button>
              <button onClick={cancelDialog} className="dialog-btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {dialogState.type === 'delete' && dialogState.fileToDelete && (
        <div className="dialog-overlay" onClick={cancelDialog}>
          <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete <strong>{dialogState.fileToDelete.name}</strong>?</p>
            <div className="dialog-buttons">
              <button onClick={confirmDelete} className="dialog-btn-danger">Delete</button>
              <button onClick={cancelDialog} className="dialog-btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileExplorer;

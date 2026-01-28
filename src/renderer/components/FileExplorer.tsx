import React, { useState, useEffect } from 'react';
import { FileItem, ProjectConfig } from '../../shared/types';

interface FileExplorerProps {
  onFileSelect: (file: FileItem) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ onFileSelect }) => {
  const [project, setProject] = useState<ProjectConfig | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

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

  const handleCreateFile = async () => {
    const fileName = prompt('Enter file name (with extension):');
    if (!fileName) return;

    try {
      if (!currentPath) {
        alert('Error: No directory selected. Please select a folder first.');
        return;
      }
      
      const filePath = `${currentPath}/${fileName}`;
      console.log('Creating file:', filePath);
      await window.api.files.create(filePath, 'file');
      await loadFiles(currentPath);
      console.log('File created successfully');
    } catch (error) {
      console.error('Failed to create file:', error);
      alert(`Failed to create file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCreateFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    try {
      if (!currentPath) {
        alert('Error: No directory selected. Please select a folder first.');
        return;
      }
      
      const folderPath = `${currentPath}/${folderName}`;
      console.log('Creating folder:', folderPath);
      await window.api.files.create(folderPath, 'directory');
      await loadFiles(currentPath);
      console.log('Folder created successfully');
    } catch (error) {
      console.error('Failed to create folder:', error);
      alert(`Failed to create folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteFile = async (file: FileItem, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm(`Delete ${file.name}?`)) return;

    try {
      await window.api.files.delete(file.path);
      await loadFiles(currentPath);
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert('Failed to delete file');
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
    </div>
  );
};

export default FileExplorer;

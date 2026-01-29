import React, { useState, useEffect } from 'react';
import FileExplorer from './components/FileExplorer';
import NotionEditorSimple from './components/NotionEditorSimple';
import { Note, FileItem } from '../shared/types';
import './styles.css';
import './file-explorer-styles.css';
import './notion-editor-styles.css';

const App: React.FC = () => {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = async (file: FileItem) => {
    if (!file.extension || (file.extension !== '.md' && file.extension !== '.markdown')) {
      return;
    }

    setLoading(true);
    try {
      // Extract note ID from file name
      const noteId = file.name.replace(/\.(md|markdown)$/, '');
      const note = await window.api.notes.getById(noteId);

      if (note) {
        setSelectedNote(note);
      } else {
        // Create a new note from the file
        const newNote: Note = {
          id: noteId,
          title: noteId,
          content: '',
          metadata: {},
          filePath: file.path,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        setSelectedNote(newNote);
      }
    } catch (error) {
      console.error('Failed to load note:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async (note: Note) => {
    try {
      await window.api.notes.save(note);
      setSelectedNote(note);
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  return (
    <div className="app-container">
      <div className="app-sidebar">
        <FileExplorer onFileSelect={handleFileSelect} />
      </div>

      <div className="app-main">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : selectedNote ? (
          <NotionEditorSimple note={selectedNote} onSave={handleSaveNote} />
        ) : (
          <div className="empty-state">
            <h2>Welcome to InsanusNotes</h2>
            <p>Select a file from the explorer or create a new one to get started.</p>
            <div className="features">
              <div className="feature">
                <span className="feature-icon">📝</span>
                <h3>Markdown Notes</h3>
                <p>Write notes with YAML frontmatter</p>
              </div>
              <div className="feature">
                <span className="feature-icon">🏗️</span>
                <h3>Interface Schemas</h3>
                <p>Define and validate note structure</p>
              </div>
              <div className="feature">
                <span className="feature-icon">📊</span>
                <p>Query CSV data sources</p>
                <h3>Dynamic References</h3>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;

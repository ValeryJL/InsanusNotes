import React, { useState, useEffect } from 'react';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import './styles.css';

interface Note {
  id: string;
  title: string;
  content: string;
  metadata: Record<string, any>;
  interfaceId?: string;
  filePath: string;
  createdAt: number;
  updatedAt: number;
}

const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const allNotes = await (window as any).api.notes.getAll();
      setNotes(allNotes);
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectNote = async (noteId: string) => {
    try {
      const note = await (window as any).api.notes.getById(noteId);
      setSelectedNote(note);
    } catch (error) {
      console.error('Failed to load note:', error);
    }
  };

  const handleSaveNote = async (note: Note) => {
    try {
      await (window as any).api.notes.save(note);
      await loadNotes();
      setSelectedNote(note);
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  const handleNewNote = () => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: 'New Note',
      content: '',
      metadata: {},
      filePath: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setSelectedNote(newNote);
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await (window as any).api.notes.delete(noteId);
      await loadNotes();
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading InsanusNotes...</div>;
  }

  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>InsanusNotes</h1>
          <button className="btn-new" onClick={handleNewNote}>+ New Note</button>
        </div>
        <NoteList
          notes={notes}
          selectedNoteId={selectedNote?.id}
          onSelectNote={handleSelectNote}
          onDeleteNote={handleDeleteNote}
        />
      </div>
      <div className="main-content">
        {selectedNote ? (
          <NoteEditor
            note={selectedNote}
            onSave={handleSaveNote}
          />
        ) : (
          <div className="empty-state">
            <h2>Welcome to InsanusNotes</h2>
            <p>Select a note or create a new one to get started.</p>
            <p className="description">
              A Linux-first, object-oriented note-taking app for programmers and world-builders.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;

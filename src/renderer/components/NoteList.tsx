import React from 'react';

interface Note {
  id: string;
  title: string;
  updatedAt: number;
}

interface NoteListProps {
  notes: Note[];
  selectedNoteId?: string;
  onSelectNote: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
}

const NoteList: React.FC<NoteListProps> = ({
  notes,
  selectedNoteId,
  onSelectNote,
  onDeleteNote
}) => {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="note-list">
      {notes.length === 0 ? (
        <div className="note-list-empty">No notes yet</div>
      ) : (
        notes.map(note => (
          <div
            key={note.id}
            className={`note-item ${selectedNoteId === note.id ? 'selected' : ''}`}
            onClick={() => onSelectNote(note.id)}
          >
            <div className="note-item-content">
              <div className="note-item-title">{note.title}</div>
              <div className="note-item-date">{formatDate(note.updatedAt)}</div>
            </div>
            <button
              className="note-item-delete"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this note?')) {
                  onDeleteNote(note.id);
                }
              }}
            >
              ×
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default NoteList;

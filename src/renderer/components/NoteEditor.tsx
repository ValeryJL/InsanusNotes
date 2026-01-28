import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Note } from '../../shared/types';

interface NoteEditorProps {
  note: Note;
  onSave: (note: Note) => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onSave }) => {
  const [title, setTitle] = useState(note.title);
  const [metadata, setMetadata] = useState(note.metadata);
  const [interfaceId, setInterfaceId] = useState(note.interfaceId || '');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: note.content,
    editorProps: {
      attributes: {
        class: 'prose-editor',
      },
    },
  });

  useEffect(() => {
    if (editor && note.content !== editor.getHTML()) {
      editor.commands.setContent(note.content);
    }
    setTitle(note.title);
    setMetadata(note.metadata);
    setInterfaceId(note.interfaceId || '');
  }, [note.id, editor]);

  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  const handleSave = () => {
    if (!editor) return;

    const updatedNote: Note = {
      ...note,
      title,
      content: editor.getHTML(),
      metadata: {
        ...metadata,
        ...(interfaceId && interfaceId.trim() ? { interface: interfaceId } : {}),
      },
      interfaceId: interfaceId && interfaceId.trim() ? interfaceId : undefined,
      updatedAt: Date.now(),
    };

    onSave(updatedNote);
  };

  const handleMetadataChange = (key: string, value: string) => {
    setMetadata(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="note-editor">
      <div className="note-editor-header">
        <input
          type="text"
          className="note-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note Title"
        />
        <button className="btn-save" onClick={handleSave}>Save</button>
      </div>

      <div className="note-metadata">
        <div className="metadata-field">
          <label>Interface:</label>
          <input
            type="text"
            value={interfaceId}
            onChange={(e) => setInterfaceId(e.target.value)}
            placeholder="Optional interface name"
          />
        </div>
      </div>

      <div className="editor-toolbar">
        <button
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={editor?.isActive('bold') ? 'active' : ''}
        >
          Bold
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={editor?.isActive('italic') ? 'active' : ''}
        >
          Italic
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleCode().run()}
          className={editor?.isActive('code') ? 'active' : ''}
        >
          Code
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor?.isActive('heading', { level: 1 }) ? 'active' : ''}
        >
          H1
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor?.isActive('heading', { level: 2 }) ? 'active' : ''}
        >
          H2
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={editor?.isActive('bulletList') ? 'active' : ''}
        >
          Bullet List
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          className={editor?.isActive('codeBlock') ? 'active' : ''}
        >
          Code Block
        </button>
      </div>

      <EditorContent editor={editor} />

      <div className="note-info">
        <small>
          Reference syntax: [[Note.{note.id}.propertyName]] or [[Data.dataSourceId.row.column]]
        </small>
      </div>
    </div>
  );
};

export default NoteEditor;

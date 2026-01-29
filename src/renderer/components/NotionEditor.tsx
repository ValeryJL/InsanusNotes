import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Note } from '../../shared/types';

interface NotionEditorProps {
  note: Note;
  onSave: (note: Note) => void;
}

interface Command {
  title: string;
  description: string;
  icon: string;
  action: () => void;
}

interface FileItem {
  id: string;
  title: string;
  path: string;
}

const NotionEditor: React.FC<NotionEditorProps> = ({ note, onSave }) => {
  const [title, setTitle] = useState(note.title);
  const [interfaceId, setInterfaceId] = useState(note.interfaceId || '');
  const [showProperties, setShowProperties] = useState(false);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [showReferenceMenu, setShowReferenceMenu] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');
  const [referenceSearch, setReferenceSearch] = useState('');
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [selectedReferenceIndex, setSelectedReferenceIndex] = useState(0);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [files, setFiles] = useState<FileItem[]>([]);

  const titleRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Load available files for references
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const project = await window.api.projects.getCurrent();
        if (project && project.path) {
          const fileList = await window.api.files.list(project.path);
          setFiles(fileList
            .filter((f: any) => f.extension === '.md' || f.extension === '.markdown')
            .map((f: any) => ({
              id: f.name.replace(/\.(md|markdown)$/, ''),
              title: f.name.replace(/\.(md|markdown)$/, ''),
              path: f.path
            })));
        }
      } catch (error) {
        console.error('Error loading files:', error);
      }
    };
    loadFiles();
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands or '[[' for references..."
      }),
    ],
    content: note.content,
    editorProps: {
      attributes: {
        class: 'notion-prose-editor',
      },
      handleKeyDown: (view: any, event: any) => {
        // Handle command menu navigation
        if (showCommandMenu) {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSelectedCommandIndex(prev => (prev + 1) % filteredCommands.length);
            return true;
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSelectedCommandIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
            return true;
          }
          if (event.key === 'Enter' || event.key === 'Tab') {
            event.preventDefault();
            filteredCommands[selectedCommandIndex]?.action();
            return true;
          }
          if (event.key === 'Escape') {
            event.preventDefault();
            setShowCommandMenu(false);
            setCommandSearch('');
            return true;
          }
        }

        // Handle reference menu navigation
        if (showReferenceMenu) {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSelectedReferenceIndex(prev => (prev + 1) % filteredFiles.length);
            return true;
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSelectedReferenceIndex(prev => (prev - 1 + filteredFiles.length) % filteredFiles.length);
            return true;
          }
          if (event.key === 'Enter' || event.key === 'Tab') {
            event.preventDefault();
            insertReference(filteredFiles[selectedReferenceIndex]);
            return true;
          }
          if (event.key === 'Escape') {
            event.preventDefault();
            setShowReferenceMenu(false);
            setReferenceSearch('');
            return true;
          }
        }

        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      const text = ed.getText();
      const { from } = ed.state.selection;

      // Detect slash command
      const textBefore = text.slice(Math.max(0, from - 20), from);
      const slashMatch = textBefore.match(/\/([a-z0-9]*)$/i);

      if (slashMatch) {
        setCommandSearch(slashMatch[1]);
        setSelectedCommandIndex(0);
        updateMenuPosition();
        setShowCommandMenu(true);
        setShowReferenceMenu(false);
      } else {
        // Detect [[ reference
        const refMatch = textBefore.match(/\[\[([^\]]*?)$/);

        if (refMatch) {
          setReferenceSearch(refMatch[1]);
          setSelectedReferenceIndex(0);
          updateMenuPosition();
          setShowReferenceMenu(true);
          setShowCommandMenu(false);
        } else {
          setShowCommandMenu(false);
          setShowReferenceMenu(false);
        }
      }
    },
  });

  const updateMenuPosition = () => {
    if (!editor || !editorRef.current) return;

    const { from } = editor.state.selection;
    const coords = editor.view.coordsAtPos(from);
    const editorRect = editorRef.current.getBoundingClientRect();

    setMenuPosition({
      top: coords.top - editorRect.top + 25,
      left: coords.left - editorRect.left,
    });
  };

  const commands: Command[] = [
    {
      title: 'Heading 1',
      description: 'Large section heading',
      icon: 'H1',
      action: () => {
        editor?.chain().focus().deleteRange({ from: editor.state.selection.from - commandSearch.length - 1, to: editor.state.selection.from }).toggleHeading({ level: 1 }).run();
        setShowCommandMenu(false);
        setCommandSearch('');
      }
    },
    {
      title: 'Heading 2',
      description: 'Medium section heading',
      icon: 'H2',
      action: () => {
        editor?.chain().focus().deleteRange({ from: editor.state.selection.from - commandSearch.length - 1, to: editor.state.selection.from }).toggleHeading({ level: 2 }).run();
        setShowCommandMenu(false);
        setCommandSearch('');
      }
    },
    {
      title: 'Heading 3',
      description: 'Small section heading',
      icon: 'H3',
      action: () => {
        editor?.chain().focus().deleteRange({ from: editor.state.selection.from - commandSearch.length - 1, to: editor.state.selection.from }).toggleHeading({ level: 3 }).run();
        setShowCommandMenu(false);
        setCommandSearch('');
      }
    },
    {
      title: 'Bullet List',
      description: 'Create a bulleted list',
      icon: '•',
      action: () => {
        editor?.chain().focus().deleteRange({ from: editor.state.selection.from - commandSearch.length - 1, to: editor.state.selection.from }).toggleBulletList().run();
        setShowCommandMenu(false);
        setCommandSearch('');
      }
    },
    {
      title: 'Numbered List',
      description: 'Create a numbered list',
      icon: '1.',
      action: () => {
        editor?.chain().focus().deleteRange({ from: editor.state.selection.from - commandSearch.length - 1, to: editor.state.selection.from }).toggleOrderedList().run();
        setShowCommandMenu(false);
        setCommandSearch('');
      }
    },
    {
      title: 'Code Block',
      description: 'Create a code block',
      icon: '</>',
      action: () => {
        editor?.chain().focus().deleteRange({ from: editor.state.selection.from - commandSearch.length - 1, to: editor.state.selection.from }).toggleCodeBlock().run();
        setShowCommandMenu(false);
        setCommandSearch('');
      }
    },
    {
      title: 'Quote',
      description: 'Create a quote block',
      icon: '"',
      action: () => {
        editor?.chain().focus().deleteRange({ from: editor.state.selection.from - commandSearch.length - 1, to: editor.state.selection.from }).toggleBlockquote().run();
        setShowCommandMenu(false);
        setCommandSearch('');
      }
    },
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.title.toLowerCase().includes(commandSearch.toLowerCase()) ||
    cmd.description.toLowerCase().includes(commandSearch.toLowerCase())
  );

  const filteredFiles = files.filter(file =>
    file.title.toLowerCase().includes(referenceSearch.toLowerCase())
  );

  const insertReference = (file: FileItem | undefined) => {
    if (!file || !editor) return;

    const from = editor.state.selection.from - referenceSearch.length - 2; // -2 for [[
    const to = editor.state.selection.from;

    editor.chain()
      .focus()
      .deleteRange({ from, to })
      .insertContent(`[[${file.id}]]`)
      .run();

    setShowReferenceMenu(false);
    setReferenceSearch('');
  };

  useEffect(() => {
    if (editor && note.content !== editor.getHTML()) {
      editor.commands.setContent(note.content);
    }
    setTitle(note.title);
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
        ...note.metadata,
        ...(interfaceId && interfaceId.trim() ? { interface: interfaceId } : {}),
      },
      interfaceId: interfaceId && interfaceId.trim() ? interfaceId : undefined,
      updatedAt: Date.now(),
    };

    onSave(updatedNote);
  };

  // Auto-save on changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (editor && (title !== note.title || editor.getHTML() !== note.content)) {
        handleSave();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [title, editor?.getHTML()]);

  return (
    <div className="notion-editor">
      <div
        className="notion-title-container"
        onMouseEnter={() => setShowProperties(true)}
        onMouseLeave={() => setShowProperties(false)}
      >
        <input
          ref={titleRef}
          type="text"
          className="notion-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
        />

        {showProperties && (
          <div className="notion-properties-panel">
            <div className="property-item">
              <span className="property-label">Interface</span>
              <input
                type="text"
                value={interfaceId}
                onChange={(e) => setInterfaceId(e.target.value)}
                placeholder="None"
                className="property-input"
              />
            </div>
          </div>
        )}
      </div>

      <div className="notion-editor-content" ref={editorRef}>
        <EditorContent editor={editor} />

        {showCommandMenu && filteredCommands.length > 0 && (
          <div
            className="command-menu"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            {filteredCommands.map((cmd, index) => (
              <div
                key={cmd.title}
                className={`command-item ${index === selectedCommandIndex ? 'selected' : ''}`}
                onClick={() => cmd.action()}
                onMouseEnter={() => setSelectedCommandIndex(index)}
              >
                <div className="command-icon">{cmd.icon}</div>
                <div className="command-content">
                  <div className="command-title">{cmd.title}</div>
                  <div className="command-description">{cmd.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showReferenceMenu && filteredFiles.length > 0 && (
          <div
            className="command-menu reference-menu"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            {filteredFiles.map((file, index) => (
              <div
                key={file.id}
                className={`command-item ${index === selectedReferenceIndex ? 'selected' : ''}`}
                onClick={() => insertReference(file)}
                onMouseEnter={() => setSelectedReferenceIndex(index)}
              >
                <div className="command-icon">📄</div>
                <div className="command-content">
                  <div className="command-title">{file.title}</div>
                  <div className="command-description">{file.path}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotionEditor;

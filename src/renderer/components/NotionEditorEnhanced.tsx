import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table';
import { TableHeader } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Strike } from '@tiptap/extension-strike';
import { Underline } from '@tiptap/extension-underline';
import { Image } from '@tiptap/extension-image';
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

const NotionEditorEnhanced: React.FC<NotionEditorProps> = ({ note, onSave }) => {
  const [title, setTitle] = useState('');
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
  const [saveStatus, setSaveStatus] = useState('');
  
  const titleRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Extract title from content and set it
  useEffect(() => {
    const content = note.content || '';
    const titleMatch = content.match(/^#\s+(.+?)$/m);
    if (titleMatch) {
      setTitle(titleMatch[1]);
    } else if (note.title) {
      setTitle(note.title);
    } else {
      setTitle('Untitled');
    }
  }, [note.content, note.title]);

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
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands or '[[' for references..."
      }),
      Table,
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Strike,
      Underline,
      Image,
    ],
    content: removeTitle(note.content || ''),
    editorProps: {
      attributes: {
        class: 'notion-prose-editor',
      },
      handleKeyDown: (view, event) => {
        // Handle command menu navigation
        if (showCommandMenu) {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSelectedCommandIndex(i => 
              i < filteredCommands.length - 1 ? i + 1 : 0
            );
            return true;
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSelectedCommandIndex(i => 
              i > 0 ? i - 1 : filteredCommands.length - 1
            );
            return true;
          }
          if (event.key === 'Enter' || event.key === 'Tab') {
            event.preventDefault();
            if (filteredCommands[selectedCommandIndex]) {
              filteredCommands[selectedCommandIndex].action();
            }
            return true;
          }
          if (event.key === 'Escape') {
            setShowCommandMenu(false);
            setCommandSearch('');
            return true;
          }
        }

        // Handle reference menu navigation
        if (showReferenceMenu) {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSelectedReferenceIndex(i => 
              i < filteredFiles.length - 1 ? i + 1 : 0
            );
            return true;
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSelectedReferenceIndex(i => 
              i > 0 ? i - 1 : filteredFiles.length - 1
            );
            return true;
          }
          if (event.key === 'Enter' || event.key === 'Tab') {
            event.preventDefault();
            if (filteredFiles[selectedReferenceIndex]) {
              insertReference(filteredFiles[selectedReferenceIndex].id);
            }
            return true;
          }
          if (event.key === 'Escape') {
            setShowReferenceMenu(false);
            setReferenceSearch('');
            return true;
          }
        }

        return false;
      },
    },
    onUpdate: ({ editor }) => {
      // Detect slash command
      const { state } = editor;
      const { selection } = state;
      const { $from } = selection;
      const text = $from.parent.textContent;
      const beforeCursor = text.slice(0, $from.parentOffset);
      
      // Check for slash command
      const slashMatch = beforeCursor.match(/\/(\w*)$/);
      if (slashMatch) {
        setCommandSearch(slashMatch[1]);
        setShowCommandMenu(true);
        setSelectedCommandIndex(0);
        updateMenuPosition();
      } else {
        setShowCommandMenu(false);
      }

      // Check for reference
      const refMatch = beforeCursor.match(/\[\[([^\]]*?)$/);
      if (refMatch) {
        setReferenceSearch(refMatch[1]);
        setShowReferenceMenu(true);
        setSelectedReferenceIndex(0);
        updateMenuPosition();
      } else {
        setShowReferenceMenu(false);
      }

      // Auto-save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        handleAutoSave(editor.getHTML());
      }, 1000);
    },
  });

  // Remove title from markdown content
  function removeTitle(content: string): string {
    return content.replace(/^#\s+.+?\n\n?/m, '');
  }

  const updateMenuPosition = () => {
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX
        });
      }
    }
  };

  const commands: Command[] = [
    {
      title: 'Heading 1',
      description: 'Large section heading',
      icon: 'H1',
      action: () => {
        editor?.chain().focus().deleteRange({ from: editor.state.selection.from - commandSearch.length - 1, to: editor.state.selection.to }).setHeading({ level: 1 }).run();
        setShowCommandMenu(false);
      }
    },
    {
      title: 'Heading 2',
      description: 'Medium section heading',
      icon: 'H2',
      action: () => {
        editor?.chain().focus().deleteRange({ from: editor.state.selection.from - commandSearch.length - 1, to: editor.state.selection.to }).setHeading({ level: 2 }).run();
        setShowCommandMenu(false);
      }
    },
    {
      title: 'Heading 3',
      description: 'Small section heading',
      icon: 'H3',
      action: () => {
        editor?.chain().focus().deleteRange({ from: editor.state.selection.from - commandSearch.length - 1, to: editor.state.selection.to }).setHeading({ level: 3 }).run();
        setShowCommandMenu(false);
      }
    },
    {
      title: 'Bullet List',
      description: 'Create a bullet list',
      icon: '•',
      action: () => {
        editor?.chain().focus().deleteRange({ from: editor.state.selection.from - commandSearch.length - 1, to: editor.state.selection.to }).toggleBulletList().run();
        setShowCommandMenu(false);
      }
    },
    {
      title: 'Numbered List',
      description: 'Create a numbered list',
      icon: '1.',
      action: () => {
        editor?.chain().focus().deleteRange({ from: editor.state.selection.from - commandSearch.length - 1, to: editor.state.selection.to }).toggleOrderedList().run();
        setShowCommandMenu(false);
      }
    },
    {
      title: 'Task List',
      description: 'Create a task list with checkboxes',
      icon: '☐',
      action: () => {
        editor?.chain().focus().deleteRange({ from: editor.state.selection.from - commandSearch.length - 1, to: editor.state.selection.to }).toggleTaskList().run();
        setShowCommandMenu(false);
      }
    },
    {
      title: 'Code Block',
      description: 'Create a code block',
      icon: '</>',
      action: () => {
        editor?.chain().focus().deleteRange({ from: editor.state.selection.from - commandSearch.length - 1, to: editor.state.selection.to }).toggleCodeBlock().run();
        setShowCommandMenu(false);
      }
    },
    {
      title: 'Quote',
      description: 'Create a quote block',
      icon: '"',
      action: () => {
        editor?.chain().focus().deleteRange({ from: editor.state.selection.from - commandSearch.length - 1, to: editor.state.selection.to }).toggleBlockquote().run();
        setShowCommandMenu(false);
      }
    },
    {
      title: 'Divider',
      description: 'Add a horizontal divider',
      icon: '—',
      action: () => {
        editor?.chain().focus().deleteRange({ from: editor.state.selection.from - commandSearch.length - 1, to: editor.state.selection.to }).setHorizontalRule().run();
        setShowCommandMenu(false);
      }
    },
    {
      title: 'Table',
      description: 'Insert a table',
      icon: '⊞',
      action: () => {
        editor?.chain().focus().deleteRange({ from: editor.state.selection.from - commandSearch.length - 1, to: editor.state.selection.to }).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        setShowCommandMenu(false);
      }
    },
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.title.toLowerCase().includes(commandSearch.toLowerCase())
  );

  const filteredFiles = files.filter(file =>
    file.title.toLowerCase().includes(referenceSearch.toLowerCase())
  );

  const insertReference = (fileId: string) => {
    if (!editor) return;
    
    const from = editor.state.selection.from - referenceSearch.length - 2; // -2 for [[
    const to = editor.state.selection.to;
    
    editor.chain()
      .focus()
      .deleteRange({ from, to })
      .insertContent(`[[${fileId}]]`)
      .run();
    
    setShowReferenceMenu(false);
    setReferenceSearch('');
  };

  const handleAutoSave = (content: string) => {
    const updatedNote = {
      ...note,
      title: title,
      content: `# ${title}\n\n${content}`,
      interfaceId: interfaceId || undefined,
      metadata: {
        ...note.metadata,
        lastModified: new Date().toISOString(),
      },
    };
    onSave(updatedNote);
  };

  const handleManualSave = () => {
    if (editor) {
      const content = editor.getHTML();
      handleAutoSave(content);
      setSaveStatus('Saved!');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  return (
    <div className="notion-editor-container">
      <div className="notion-header">
        <div 
          className="notion-title-container"
          onMouseEnter={() => setShowProperties(true)}
          onMouseLeave={() => setShowProperties(false)}
        >
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="notion-title"
            placeholder="Untitled"
          />
          {showProperties && (
            <div className="notion-properties-panel">
              <div className="notion-property">
                <label>Interface:</label>
                <input
                  type="text"
                  value={interfaceId}
                  onChange={(e) => setInterfaceId(e.target.value)}
                  placeholder="None"
                />
              </div>
            </div>
          )}
        </div>
        
        <button 
          className="notion-save-button"
          onClick={handleManualSave}
          title="Save (Ctrl+S)"
        >
          💾 {saveStatus || 'Save'}
        </button>
      </div>

      <div ref={editorRef} className="notion-editor-wrapper">
        <EditorContent editor={editor} />
      </div>

      {showCommandMenu && filteredCommands.length > 0 && (
        <div 
          className="notion-command-menu"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          {filteredCommands.map((cmd, index) => (
            <div
              key={cmd.title}
              className={`notion-command-item ${index === selectedCommandIndex ? 'selected' : ''}`}
              onClick={() => cmd.action()}
            >
              <span className="command-icon">{cmd.icon}</span>
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
          className="notion-command-menu"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          {filteredFiles.map((file, index) => (
            <div
              key={file.id}
              className={`notion-command-item ${index === selectedReferenceIndex ? 'selected' : ''}`}
              onClick={() => insertReference(file.id)}
            >
              <span className="command-icon">📄</span>
              <div className="command-content">
                <div className="command-title">{file.title}</div>
                <div className="command-description">{file.path}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotionEditorEnhanced;

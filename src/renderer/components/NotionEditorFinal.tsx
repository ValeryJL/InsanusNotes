import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent, Extension } from '@tiptap/react';
import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
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

interface PropertyDef {
  name: string;
  value: string;
}

// Custom Reference Node
const Reference = Node.create({
  name: 'reference',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      ref: {
        default: '',
      },
      resolved: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-reference]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-reference': '' }), 0];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('span');
      dom.className = 'reference-node';
      
      const updateView = () => {
        const { state } = editor;
        const pos = typeof getPos === 'function' ? getPos() : undefined;
        
        // Check if cursor is in this node
        let isSelected = false;
        if (pos !== undefined && pos !== -1) {
          const { from, to } = state.selection;
          isSelected = from >= pos && to <= pos + node.nodeSize;
        }
        
        if (isSelected) {
          // Show raw syntax when editing
          dom.textContent = `[[${node.attrs.ref}]]`;
          dom.className = 'reference-node reference-raw';
          dom.contentEditable = 'true';
        } else {
          // Show resolved content when not editing
          if (node.attrs.resolved) {
            dom.textContent = node.attrs.resolved;
            dom.className = 'reference-node reference-resolved';
          } else {
            dom.textContent = node.attrs.ref;
            dom.className = 'reference-node reference-unresolved';
          }
          dom.contentEditable = 'false';
        }
      };

      updateView();

      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type.name !== 'reference') return false;
          updateView();
          return true;
        },
      };
    };
  },
});

const NotionEditorFinal: React.FC<NotionEditorProps> = ({ note, onSave }) => {
  const [title, setTitle] = useState('');
  const [showProperties, setShowProperties] = useState(false);
  const [customProperties, setCustomProperties] = useState<PropertyDef[]>([]);
  const [interfaceValue, setInterfaceValue] = useState('');
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

  // Extract title and properties from note
  useEffect(() => {
    const content = note.content || '';
    
    // Extract title from first # heading
    const titleMatch = content.match(/^#\s+(.+?)$/m);
    if (titleMatch) {
      setTitle(titleMatch[1]);
    } else if (note.title) {
      setTitle(note.title);
    } else {
      setTitle('Untitled');
    }

    // Extract properties from metadata
    const metadata = note.metadata || {};
    setInterfaceValue(metadata.interface || '');
    
    const props: PropertyDef[] = [];
    Object.keys(metadata).forEach(key => {
      if (key !== 'interface' && key !== 'lastModified') {
        props.push({ name: key, value: String(metadata[key]) });
      }
    });
    setCustomProperties(props);
  }, [note]);

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
      Table.configure({
        resizable: true,
      }),
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
      Reference,
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
        handleAutoSave();
      }, 1000);
    },
  });

  // Remove title from markdown content
  function removeTitle(content: string): string {
    // Remove first # heading line and any blank lines after it
    return content.replace(/^#\s+.+?$\n*/m, '');
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
      description: 'Insert a code block',
      icon: '</>',
      action: () => {
        editor?.chain().focus().deleteRange({ from: editor.state.selection.from - commandSearch.length - 1, to: editor.state.selection.to }).setCodeBlock().run();
        setShowCommandMenu(false);
      }
    },
    {
      title: 'Quote',
      description: 'Insert a quote block',
      icon: '❝',
      action: () => {
        editor?.chain().focus().deleteRange({ from: editor.state.selection.from - commandSearch.length - 1, to: editor.state.selection.to }).setBlockquote().run();
        setShowCommandMenu(false);
      }
    },
    {
      title: 'Divider',
      description: 'Insert a horizontal divider',
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
    cmd.title.toLowerCase().includes(commandSearch.toLowerCase()) ||
    cmd.description.toLowerCase().includes(commandSearch.toLowerCase())
  );

  const filteredFiles = files.filter(file => 
    file.title.toLowerCase().includes(referenceSearch.toLowerCase())
  );

  const insertReference = async (fileId: string) => {
    if (!editor) return;
    
    const { state } = editor;
    const { selection } = state;
    const { $from } = selection;
    const text = $from.parent.textContent;
    const beforeCursor = text.slice(0, $from.parentOffset);
    
    // Find the [[ position
    const refMatch = beforeCursor.match(/\[\[([^\]]*)$/);
    if (!refMatch) return;
    
    const from = selection.from - refMatch[0].length;
    const to = selection.to;
    
    // Resolve the reference
    let resolved = fileId;
    try {
      // For now, just use the file ID as the resolved value
      // In future, we could fetch actual metadata
      resolved = fileId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    } catch (error) {
      console.error('Error resolving reference:', error);
    }

    editor.chain()
      .focus()
      .deleteRange({ from, to })
      .insertContent({
        type: 'reference',
        attrs: {
          ref: fileId,
          resolved: resolved,
        },
      })
      .run();
    
    setShowReferenceMenu(false);
    setReferenceSearch('');
  };

  const handleAutoSave = () => {
    if (!editor) return;
    
    const content = editor.getHTML();
    
    // Build metadata from properties
    const metadata: Record<string, any> = {
      lastModified: new Date().toISOString(),
    };
    
    if (interfaceValue) {
      metadata.interface = interfaceValue;
    }
    
    customProperties.forEach(prop => {
      if (prop.name && prop.value) {
        metadata[prop.name] = prop.value;
      }
    });

    const updatedNote = {
      ...note,
      title: title,
      content: `# ${title}\n\n${content}`,
      metadata,
    };
    onSave(updatedNote);
  };

  const handleManualSave = () => {
    handleAutoSave();
    setSaveStatus('Saved!');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const handleAddProperty = () => {
    setCustomProperties([...customProperties, { name: '', value: '' }]);
  };

  const handleUpdateProperty = (index: number, field: 'name' | 'value', value: string) => {
    const updated = [...customProperties];
    updated[index][field] = value;
    setCustomProperties(updated);
  };

  const handleDeleteProperty = (index: number) => {
    setCustomProperties(customProperties.filter((_, i) => i !== index));
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
              <h4>Properties</h4>
              
              <div className="notion-property">
                <label>Interface:</label>
                <input
                  type="text"
                  value={interfaceValue}
                  onChange={(e) => setInterfaceValue(e.target.value)}
                  placeholder="None"
                />
              </div>

              <hr />
              <h5>Custom Properties:</h5>
              
              {customProperties.map((prop, index) => (
                <div key={index} className="notion-property-row">
                  <input
                    type="text"
                    value={prop.name}
                    onChange={(e) => handleUpdateProperty(index, 'name', e.target.value)}
                    placeholder="name"
                    className="property-name"
                  />
                  <input
                    type="text"
                    value={prop.value}
                    onChange={(e) => handleUpdateProperty(index, 'value', e.target.value)}
                    placeholder="value"
                    className="property-value"
                  />
                  <button 
                    className="property-delete"
                    onClick={() => handleDeleteProperty(index)}
                  >
                    🗑️
                  </button>
                </div>
              ))}
              
              <button 
                className="add-property-button"
                onClick={handleAddProperty}
              >
                ➕ Add Property
              </button>
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

export default NotionEditorFinal;

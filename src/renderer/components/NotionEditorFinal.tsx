import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent, Extension } from '@tiptap/react';
import { Node, mergeAttributes } from '@tiptap/core';
import TurndownService from 'turndown';
import { marked } from 'marked';
import { Plugin, PluginKey, TextSelection } from 'prosemirror-state';
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
    // Leaf/atom node: do not include child content placeholder (0)
    return ['span', mergeAttributes(HTMLAttributes, { 'data-reference': '' })];
  },

  addNodeView() {
    return ({ node, getPos, editor }: { node: any; getPos: any; editor: any }) => {
      const dom = document.createElement('span');
      dom.className = 'reference-node';

      let currentPos: number | undefined = undefined;

      const resolveReference = async (ref: string) => {
        try {
          const resolved = await window.api.references.resolve(`[[${ref}]]`);
          // update node attrs with resolved value
          if (typeof getPos === 'function' && currentPos !== undefined) {
            const tr = editor.state.tr.setNodeMarkup(currentPos, undefined, {
              ...node.attrs,
              resolved: resolved || ''
            });
            editor.view.dispatch(tr);
          }
        } catch (e) {
          // ignore resolution errors
        }
      };

      const isCursorInsideNode = () => {
        const { selection } = editor.state;
        if (!selection || !selection.empty) return false; // require collapsed text cursor only

        const from = selection.from;

        if (typeof getPos !== 'function') return false;
        const pos = getPos();
        if (typeof pos !== 'number' || pos === -1) return false;
        currentPos = pos;

        // Consider cursor "inside" the inline node when the caret index
        // is between the node start and end (inclusive). This makes the
        // raw-edit mode active when the caret is on the node.
        const nodeStart = pos;
        const nodeEnd = pos + node.nodeSize;

        return from >= nodeStart && from <= nodeEnd;
      };

      const updateView = () => {
        const inside = isCursorInsideNode();

        if (inside) {
          // Show raw syntax when text cursor is inside the node
          dom.textContent = `[[${node.attrs.ref}]]`;
          dom.className = 'reference-node reference-raw';
          dom.contentEditable = 'true';
          // Ensure listeners attached once
          dom.removeEventListener('blur', onBlur);
          dom.removeEventListener('keydown', onKeyDown);
          dom.addEventListener('blur', onBlur);
          dom.addEventListener('keydown', onKeyDown);
          // Focus the inline DOM so the user can type raw text directly
          try {
            // Use requestAnimationFrame to avoid interfering with ProseMirror selection
            requestAnimationFrame(() => {
              if (dom && typeof (dom as HTMLElement).focus === 'function') {
                (dom as HTMLElement).focus();
              }
            });
          } catch (e) {
            // ignore
          }
        } else {
          // Ensure listeners removed when not editing
          dom.removeEventListener('blur', onBlur);
          dom.removeEventListener('keydown', onKeyDown);
          dom.contentEditable = 'false';

          // Show resolved content when not editing
          if (node.attrs.resolved) {
            dom.textContent = node.attrs.resolved;
            dom.className = 'reference-node reference-resolved';
          } else if (node.attrs.ref) {
            dom.textContent = node.attrs.ref;
            dom.className = 'reference-node reference-unresolved';
            // Try to resolve in background
            resolveReference(node.attrs.ref);
          } else {
            dom.textContent = '';
            dom.className = 'reference-node reference-empty';
          }
        }
      };

      const commitChange = (rawText: string) => {
        // Extract inner ref from possible [[...]] input
        const m = rawText.match(/\[\[\s*(.*?)\s*\]\]/);
        const newRef = m ? m[1] : rawText.trim();

        if (typeof getPos !== 'function') return;
        const pos = getPos();
        if (typeof pos !== 'number' || pos === -1) return;

        const tr = editor.state.tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          ref: newRef,
          resolved: ''
        });
        editor.view.dispatch(tr);

        // Attempt async resolution after commit
        resolveReference(newRef);
      };

      const onBlur = (e: FocusEvent) => {
        const text = dom.textContent || '';
        commitChange(text);
      };

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          // commit and move cursor after node
          const text = dom.textContent || '';
          commitChange(text);
          // move cursor one position after node
          if (typeof getPos === 'function') {
            const pos = getPos();
            if (typeof pos === 'number' && pos !== -1) {
              const tr = editor.state.tr.setSelection(
                TextSelection.create(editor.state.doc, pos + node.nodeSize)
              );
              editor.view.dispatch(tr);
            }
          }
        }
      };

      updateView();

      return {
        dom,
        update: (updatedNode: any) => {
          if (updatedNode.type.name !== 'reference') return false;
          // update local node ref/resolved attrs
          node = updatedNode;
          updateView();
          return true;
        },
        destroy: () => {
          dom.removeEventListener('blur', onBlur);
          dom.removeEventListener('keydown', onKeyDown);
        }
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
  // Raw markdown editor state
  const [showRawEditor, setShowRawEditor] = useState(false);
  const [rawMarkdown, setRawMarkdown] = useState('');

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
    // Build extensions list and remove duplicates by name to avoid tiptap warnings
    extensions: (() => {
      const raw = [
        StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
        Link.configure({ openOnClick: false }),
        Placeholder.configure({ placeholder: "Type '/' for commands or '[[' for references..." }),
        Table.configure({ resizable: true }),
        TableRow,
        TableHeader,
        TableCell,
        TaskList,
        TaskItem.configure({ nested: true }),
        // Strike may be included in StarterKit; Underline is separate
        Strike,
        Underline,
        Image,
        Reference,
      ];

      const seen = new Set<string>();
      const uniq: any[] = [];
      for (const ext of raw) {
        const name = (ext as any).name || (ext as any).constructor?.name || null;
        if (!name) {
          uniq.push(ext);
          continue;
        }
        if (!seen.has(name)) {
          seen.add(name);
          uniq.push(ext);
        }
      }
      return uniq;
    })(),
    // Convert Markdown body to HTML for the editor
    content: (() => {
      try {
        const mdBody = removeTitle(note.content || '');
        return marked.parse(mdBody || '');
      } catch (e) {
        return removeTitle(note.content || '');
      }
    })(),
    editorProps: {
      attributes: {
        class: 'notion-prose-editor',
      },
      handleKeyDown: (view: any, event: any) => {
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

      // Detect if caret is on/inside a reference inline node and open overlay
      try {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;
        if ($from) {
          let refNode: any = null;
          let nodePos: number | null = null;

          if ($from.nodeAfter && $from.nodeAfter.type && $from.nodeAfter.type.name === 'reference') {
            refNode = $from.nodeAfter;
            nodePos = selection.from;
          } else if ($from.nodeBefore && $from.nodeBefore.type && $from.nodeBefore.type.name === 'reference') {
            refNode = $from.nodeBefore;
            nodePos = selection.from - $from.nodeBefore.nodeSize;
          }

          if (refNode && nodePos !== null) {
            // compute screen rect for caret to position overlay
            const selectionRange = window.getSelection();
            let rect = null;
            if (selectionRange && selectionRange.rangeCount > 0) {
              rect = selectionRange.getRangeAt(0).getBoundingClientRect();
            }
            setOverlayValue(`[[${refNode.attrs.ref || ''}]]`);
            setOverlayPos(nodePos);
            setOverlayRect(rect ? { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX } : null);
            setShowOverlay(true);
          } else {
            setShowOverlay(false);
          }
        }
      } catch (e) {
        // ignore
      }
    },
  });

  // Update editor content when `note` changes (reloads without remount)
  useEffect(() => {
    if (!editor) return;
    try {
      const mdBody = removeTitle(note.content || '');
      const html = marked.parse(mdBody || '');
      editor.commands.setContent(html);
    } catch (e) {
      // fallback: set raw content
      editor.commands.setContent(removeTitle(note.content || ''));
    }
  }, [note.id, editor]);

  // Overlay state for raw reference editing
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayValue, setOverlayValue] = useState('');
  const [overlayPos, setOverlayPos] = useState<number | null>(null);
  const [overlayRect, setOverlayRect] = useState<{ top: number; left: number } | null>(null);

  const commitOverlay = () => {
    if (!editor || overlayPos === null) return;
    const rawText = overlayValue || '';
    const m = rawText.match(/\[\[\s*(.*?)\s*\]\]/);
    const newRef = m ? m[1] : rawText.trim();

    try {
      const tr = editor.state.tr.setNodeMarkup(overlayPos, undefined, {
        ...(editor.state.doc.nodeAt(overlayPos) as any)?.attrs,
        ref: newRef,
        resolved: ''
      });
      editor.view.dispatch(tr);
    } catch (e) {
      console.error('Failed to commit overlay ref:', e);
    }

    setShowOverlay(false);
    // attempt async resolve (will be triggered by node view too)
    try { window.api.references.resolve(`[[${newRef}]]`); } catch { }
  };

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

    const htmlContent = editor.getHTML();
    // Convert HTML back to Markdown for storage
    const td = new TurndownService();
    const markdownBody = td.turndown(htmlContent);

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
      content: `# ${title}\n\n${markdownBody}`,
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
        <button
          className="notion-raw-button"
          onClick={() => {
            // Open raw editor with full markdown (including title/frontmatter)
            const full = note.content || `# ${title}\n\n`;
            setRawMarkdown(full);
            setShowRawEditor(true);
          }}
          title="Edit raw markdown"
        >
          📝 Raw
        </button>
      </div>

      <div ref={editorRef} className="notion-editor-wrapper">
        <EditorContent editor={editor} />
      </div>

      {/* Full raw markdown editor modal */}
      {showRawEditor && (
        <div className="raw-editor-overlay">
          <div className="raw-editor-dialog">
            <textarea
              value={rawMarkdown}
              onChange={(e) => setRawMarkdown(e.target.value)}
              style={{ width: '100%', height: '60vh' }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => {
                // Save raw markdown to note
                const updatedNote = {
                  ...note,
                  title,
                  content: rawMarkdown,
                  metadata: {
                    ...note.metadata,
                    lastModified: new Date().toISOString(),
                    ...(interfaceValue ? { interface: interfaceValue } : {})
                  }
                };
                onSave(updatedNote);
                setShowRawEditor(false);
                // Update editor content to reflect new markdown
                try {
                  const mdBody = removeTitle(rawMarkdown || '');
                  const html = marked.parse(mdBody || '');
                  editor?.commands.setContent(html);
                } catch (e) { }
              }}>Save Raw</button>
              <button onClick={() => setShowRawEditor(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

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

      {/* Overlay textarea for raw reference editing */}
      {showOverlay && overlayRect && (
        <div
          className="reference-overlay"
          style={{ position: 'absolute', top: overlayRect.top + 'px', left: overlayRect.left + 'px', zIndex: 1000 }}
        >
          <textarea
            autoFocus
            value={overlayValue}
            onChange={(e) => setOverlayValue(e.target.value)}
            onBlur={() => commitOverlay()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitOverlay();
              } else if (e.key === 'Escape') {
                setShowOverlay(false);
              }
            }}
            style={{ minWidth: 200, minHeight: 30 }}
          />
        </div>
      )}
    </div>
  );
};

export default NotionEditorFinal;

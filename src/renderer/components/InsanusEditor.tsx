import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Strike } from '@tiptap/extension-strike';
import { Underline } from '@tiptap/extension-underline';
import { Image } from '@tiptap/extension-image';
import { Node, mergeAttributes } from '@tiptap/core';
import { Note } from '../../shared/types';

interface Props {
  note: Note;
  onSave: (note: Note) => void;
}

// Parse YAML frontmatter
function parseFrontmatter(content: string): { metadata: Record<string, any>; body: string } {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!fmMatch) return { metadata: {}, body: content };
  
  const fmText = fmMatch[1];
  const body = content.slice(fmMatch[0].length);
  const metadata: Record<string, any> = {};
  
  fmText.split('\n').forEach(line => {
    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (match) {
      metadata[match[1].trim()] = match[2].trim();
    }
  });
  
  return { metadata, body };
}

// Build YAML frontmatter
function buildFrontmatter(metadata: Record<string, any>): string {
  const keys = Object.keys(metadata);
  if (keys.length === 0) return '';
  const lines = keys.map(k => `${k}: ${metadata[k]}`).join('\n');
  return `---\n${lines}\n---\n\n`;
}

// Extract title from markdown
function extractTitle(content: string): { title: string; content: string } {
  const lines = content.split('\n');
  if (lines[0] && lines[0].startsWith('# ')) {
    const title = lines[0].substring(2).trim();
    const remainingContent = lines.slice(1).join('\n').trim();
    return { title, content: remainingContent };
  }
  return { title: '', content };
}

// Custom Reference extension for [[ref]] syntax
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
    return ['span', mergeAttributes({ 'data-reference': '' }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ReferenceComponent);
  },
});

// Reference component with cursor-aware rendering
const ReferenceComponent = ({ node, editor }: any) => {
  const [resolvedText, setResolvedText] = useState(node.attrs.ref);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Resolve reference via IPC
    const ref = node.attrs.ref;
    if (window.api?.references?.resolve) {
      window.api.references.resolve(ref)
        .then((text: string) => setResolvedText(text || ref))
        .catch(() => setResolvedText(ref));
    }
  }, [node.attrs.ref]);

  // Check if cursor is in this node
  const { from, to } = editor.state.selection;
  const nodePos = editor.state.doc.resolve(from).before();
  const isCursorInNode = from >= nodePos && to <= nodePos + node.nodeSize;

  if (isCursorInNode || isHovered) {
    // Show raw syntax when editing
    return (
      <span 
        className="reference-raw"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        [[{node.attrs.ref}]]
      </span>
    );
  }

  // Show resolved content when viewing
  return (
    <span 
      className="reference-resolved"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {resolvedText}
    </span>
  );
};

const InsanusEditor: React.FC<Props> = ({ note, onSave }) => {
  const [title, setTitle] = useState('');
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [showProperties, setShowProperties] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [slashFilter, setSlashFilter] = useState('');
  const [showReferenceMenu, setShowReferenceMenu] = useState(false);
  const [referenceMenuPosition, setReferenceMenuPosition] = useState({ top: 0, left: 0 });
  const [referenceFilter, setReferenceFilter] = useState('');
  const [availableReferences, setAvailableReferences] = useState<string[]>([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState(0);
  const [saveStatus, setSaveStatus] = useState('');
  const saveTimerRef = useRef<number | null>(null);
  
  const editor = useEditor({
    extensions: [
      StarterKit,
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
      Reference,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      // Auto-save after 1 second of inactivity
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = window.setTimeout(() => {
        handleSave();
      }, 1000);

      // Check for slash command trigger
      const { state } = editor;
      const { from, to } = state.selection;
      const text = state.doc.textBetween(Math.max(0, from - 20), to, '\n');
      
      if (text.endsWith('/')) {
        const coords = editor.view.coordsAtPos(from);
        setSlashMenuPosition({ top: coords.top + 20, left: coords.left });
        setSlashFilter('');
        setShowSlashMenu(true);
        setSelectedMenuItem(0);
      } else if (showSlashMenu && text.match(/\/\w+$/)) {
        const match = text.match(/\/(\w+)$/);
        if (match) {
          setSlashFilter(match[1]);
          setSelectedMenuItem(0);
        }
      } else if (!text.includes('/') || text.endsWith(' ')) {
        setShowSlashMenu(false);
      }

      // Check for reference trigger
      if (text.endsWith('[[')) {
        const coords = editor.view.coordsAtPos(from);
        setReferenceMenuPosition({ top: coords.top + 20, left: coords.left });
        setReferenceFilter('');
        setShowReferenceMenu(true);
        setSelectedMenuItem(0);
        loadAvailableReferences();
      } else if (showReferenceMenu && text.match(/\[\[\w*$/)) {
        const match = text.match(/\[\[(\w*)$/);
        if (match) {
          setReferenceFilter(match[1]);
          setSelectedMenuItem(0);
        }
      } else if (!text.includes('[[') || text.endsWith(']]')) {
        setShowReferenceMenu(false);
      }
    },
  });

  // Load note content
  useEffect(() => {
    if (!editor || !note) return;

    const { metadata: parsedMetadata, body } = parseFrontmatter(note.content || '');
    const { title: extractedTitle, content } = extractTitle(body);

    setTitle(extractedTitle || parsedMetadata.title || note.title || '');
    setMetadata(parsedMetadata);
    editor.commands.setContent(content);
  }, [note.id, editor]);

  const loadAvailableReferences = async () => {
    try {
      // Get current project to get the path
      const project = await window.api.projects.getCurrent();
      if (!project) {
        setAvailableReferences([]);
        return;
      }
      
      const files = await window.api.files.list(project.path);
      const mdFiles = files
        .filter((f: any) => f.extension === '.md' || f.extension === '.markdown')
        .map((f: any) => f.name.replace(/\.(md|markdown)$/, ''));
      setAvailableReferences(mdFiles);
    } catch (error) {
      console.error('Failed to load references:', error);
      setAvailableReferences([]);
    }
  };

  const handleSave = () => {
    if (!editor) return;

    const content = editor.getHTML();
    const markdown = htmlToMarkdown(content);
    const fullContent = buildFrontmatter(metadata) + `# ${title}\n\n${markdown}`;

    const updatedNote: Note = {
      ...note,
      title,
      content: fullContent,
      metadata,
      updatedAt: Date.now(),
    };

    onSave(updatedNote);
    setSaveStatus('Saved!');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const htmlToMarkdown = (html: string): string => {
    // Simple HTML to Markdown conversion
    // This is a basic implementation - you might want to use a library like turndown
    let md = html;
    
    // Remove wrapper
    md = md.replace(/<\/?p>/g, '\n\n');
    
    // Headings
    md = md.replace(/<h1>(.*?)<\/h1>/g, '# $1\n');
    md = md.replace(/<h2>(.*?)<\/h2>/g, '## $1\n');
    md = md.replace(/<h3>(.*?)<\/h3>/g, '### $1\n');
    
    // Bold, italic, strike
    md = md.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
    md = md.replace(/<em>(.*?)<\/em>/g, '*$1*');
    md = md.replace(/<s>(.*?)<\/s>/g, '~~$1~~');
    
    // Lists
    md = md.replace(/<ul>(.*?)<\/ul>/gs, (_, content) => {
      return content.replace(/<li>(.*?)<\/li>/g, '- $1\n');
    });
    md = md.replace(/<ol>(.*?)<\/ol>/gs, (_, content) => {
      let counter = 1;
      return content.replace(/<li>(.*?)<\/li>/g, () => `${counter++}. $1\n`);
    });
    
    // Code
    md = md.replace(/<code>(.*?)<\/code>/g, '`$1`');
    md = md.replace(/<pre><code>(.*?)<\/code><\/pre>/gs, '```\n$1\n```\n');
    
    // Links and images
    md = md.replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)');
    md = md.replace(/<img src="(.*?)" alt="(.*?)">/g, '![$2]($1)');
    
    // Clean up multiple newlines
    md = md.replace(/\n{3,}/g, '\n\n').trim();
    
    return md;
  };

  const slashCommands = [
    { label: 'Heading 1', icon: 'H1', action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: 'Heading 2', icon: 'H2', action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: 'Heading 3', icon: 'H3', action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: 'Bullet List', icon: '•', action: () => editor?.chain().focus().toggleBulletList().run() },
    { label: 'Numbered List', icon: '1.', action: () => editor?.chain().focus().toggleOrderedList().run() },
    { label: 'Task List', icon: '☑', action: () => editor?.chain().focus().toggleTaskList().run() },
    { label: 'Code Block', icon: '</>', action: () => editor?.chain().focus().toggleCodeBlock().run() },
    { label: 'Table', icon: '⊞', action: () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
    { label: 'Quote', icon: '❝', action: () => editor?.chain().focus().toggleBlockquote().run() },
    { label: 'Divider', icon: '─', action: () => editor?.chain().focus().setHorizontalRule().run() },
  ];

  const filteredCommands = slashCommands.filter(cmd =>
    cmd.label.toLowerCase().includes(slashFilter.toLowerCase())
  );

  const filteredReferences = availableReferences.filter(ref =>
    ref.toLowerCase().includes(referenceFilter.toLowerCase())
  );

  const executeSlashCommand = (command: typeof slashCommands[0]) => {
    if (!editor) return;
    
    // Remove the slash trigger
    const { state } = editor;
    const { from } = state.selection;
    const slashPos = state.doc.textBetween(Math.max(0, from - 20), from).lastIndexOf('/');
    if (slashPos >= 0) {
      editor.chain()
        .deleteRange({ from: from - (state.doc.textBetween(Math.max(0, from - 20), from).length - slashPos), to: from })
        .run();
    }
    
    command.action();
    setShowSlashMenu(false);
  };

  const insertReference = (ref: string) => {
    if (!editor) return;
    
    // Remove the [[ trigger
    const { state } = editor;
    const { from } = state.selection;
    const bracketPos = state.doc.textBetween(Math.max(0, from - 20), from).lastIndexOf('[[');
    if (bracketPos >= 0) {
      editor.chain()
        .deleteRange({ from: from - (state.doc.textBetween(Math.max(0, from - 20), from).length - bracketPos), to: from })
        .insertContent(`[[${ref}]]`)
        .run();
    }
    
    setShowReferenceMenu(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSlashMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMenuItem(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMenuItem(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        executeSlashCommand(filteredCommands[selectedMenuItem]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSlashMenu(false);
      }
    }

    if (showReferenceMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMenuItem(prev => (prev + 1) % filteredReferences.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMenuItem(prev => (prev - 1 + filteredReferences.length) % filteredReferences.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (filteredReferences[selectedMenuItem]) {
          insertReference(filteredReferences[selectedMenuItem]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowReferenceMenu(false);
      }
    }
  };

  const addProperty = () => {
    setMetadata(prev => ({ ...prev, 'newProperty': '' }));
  };

  const updateProperty = (oldKey: string, newKey: string, value: string) => {
    setMetadata(prev => {
      const newMetadata = { ...prev };
      if (oldKey !== newKey) {
        delete newMetadata[oldKey];
      }
      newMetadata[newKey] = value;
      return newMetadata;
    });
  };

  const deleteProperty = (key: string) => {
    setMetadata(prev => {
      const newMetadata = { ...prev };
      delete newMetadata[key];
      return newMetadata;
    });
  };

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="insanus-editor" onKeyDown={handleKeyDown}>
      {/* Title and Save Button */}
      <div className="editor-header">
        <input
          type="text"
          className="editor-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          onMouseEnter={() => setShowProperties(true)}
          onMouseLeave={() => setShowProperties(false)}
        />
        <button className="save-button" onClick={handleSave} title="Save (Ctrl+S)">
          💾 {saveStatus}
        </button>
      </div>

      {/* Properties Panel */}
      {showProperties && (
        <div 
          className="properties-panel"
          onMouseEnter={() => setShowProperties(true)}
          onMouseLeave={() => setShowProperties(false)}
        >
          <h4>Properties</h4>
          <div className="property-list">
            {Object.entries(metadata).map(([key, value]) => (
              <div key={key} className="property-row">
                <input
                  type="text"
                  className="property-key"
                  value={key}
                  onChange={(e) => updateProperty(key, e.target.value, value)}
                  placeholder="Property name"
                />
                <input
                  type="text"
                  className="property-value"
                  value={value}
                  onChange={(e) => updateProperty(key, key, e.target.value)}
                  placeholder="Value"
                />
                <button 
                  className="delete-property"
                  onClick={() => deleteProperty(key)}
                  title="Delete property"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
          <button className="add-property" onClick={addProperty}>
            ➕ Add Property
          </button>
        </div>
      )}

      {/* Editor Content */}
      <div className="editor-content-wrapper">
        <EditorContent editor={editor} className="editor-content" />
      </div>

      {/* Slash Command Menu */}
      {showSlashMenu && (
        <div 
          className="command-menu"
          style={{ 
            position: 'fixed', 
            top: slashMenuPosition.top, 
            left: slashMenuPosition.left 
          }}
        >
          {filteredCommands.map((cmd, idx) => (
            <div
              key={cmd.label}
              className={`command-item ${idx === selectedMenuItem ? 'selected' : ''}`}
              onClick={() => executeSlashCommand(cmd)}
              onMouseEnter={() => setSelectedMenuItem(idx)}
            >
              <span className="command-icon">{cmd.icon}</span>
              <span className="command-label">{cmd.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Reference Menu */}
      {showReferenceMenu && (
        <div 
          className="reference-menu"
          style={{ 
            position: 'fixed', 
            top: referenceMenuPosition.top, 
            left: referenceMenuPosition.left 
          }}
        >
          {filteredReferences.length > 0 ? (
            filteredReferences.map((ref, idx) => (
              <div
                key={ref}
                className={`reference-item ${idx === selectedMenuItem ? 'selected' : ''}`}
                onClick={() => insertReference(ref)}
                onMouseEnter={() => setSelectedMenuItem(idx)}
              >
                📄 {ref}
              </div>
            ))
          ) : (
            <div className="reference-item">No references found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default InsanusEditor;

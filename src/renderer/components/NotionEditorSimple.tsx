import React, { useEffect, useRef, useState } from 'react';
import { Note } from '../../shared/types';

interface Props {
    note: Note;
    onSave: (note: Note) => void;
}

// Very small frontmatter parser (only simple key: value pairs)
function parseFrontmatter(md: string) {
    const fmMatch = md.match(/^---\n([\s\S]*?)\n---\n?/);
    if (!fmMatch) return { metadata: {}, body: md };
    const fm = fmMatch[1];
    const body = md.slice(fmMatch[0].length);
    const metadata: Record<string, string> = {};
    fm.split(/\n/).forEach(line => {
        const m = line.match(/^([^:]+):\s*(.*)$/);
        if (m) metadata[m[1].trim()] = m[2].trim();
    });
    return { metadata, body };
}

function buildFrontmatter(metadata: Record<string, string>) {
    const keys = Object.keys(metadata);
    if (keys.length === 0) return '';
    const body = keys.map(k => `${k}: ${metadata[k]}`).join('\n');
    return `---\n${body}\n---\n\n`;
}

const safeRender = (md: string) => {
    // Try marked if available, fallback to simple escapes
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const marked = require('marked');
        return marked(md);
    } catch (e) {
        const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<pre>${esc(md)}</pre>`;
    }
};

const NotionEditorSimple: React.FC<Props> = ({ note, onSave }) => {
    const { metadata, body } = parseFrontmatter(note.content || '');
    const [raw, setRaw] = useState(note.content || '');
    const [meta, setMeta] = useState<Record<string, string>>(metadata);
    const [preview, setPreview] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const saveTimer = useRef<number | null>(null);

    useEffect(() => {
        setRaw(note.content || '');
        const parsed = parseFrontmatter(note.content || '');
        setMeta(parsed.metadata);
    }, [note.id]);

    useEffect(() => {
        if (saveTimer.current) window.clearTimeout(saveTimer.current);
        saveTimer.current = window.setTimeout(() => handleSave(), 1000);
        return () => { if (saveTimer.current) window.clearTimeout(saveTimer.current); };
    }, [raw, meta]);

    const handleSave = () => {
        const fm = buildFrontmatter(meta);
        const content = fm + raw.replace(/^---\n[\s\S]*?\n---\n?/, '');
        const updated: Note = {
            ...note,
            content,
            metadata: { ...note.metadata, ...meta },
            title: meta.title || note.title || '',
            updatedAt: Date.now(),
        };
        onSave(updated);
    };

    const updateMetaKey = (key: string, value: string) => {
        setMeta(prev => ({ ...prev, [key]: value }));
    };

    const addMetaField = () => {
        setMeta(prev => ({ ...prev, 'new': '' }));
    };

    const removeMetaField = (key: string) => {
        setMeta(prev => { const p = { ...prev }; delete p[key]; return p; });
    };

    const insertReferenceAtCursor = (id: string) => {
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart || 0;
        const end = ta.selectionEnd || 0;
        const before = raw.slice(0, start);
        const after = raw.slice(end);
        const updated = `${before}[[${id}]]${after}`;
        setRaw(updated);
        // restore cursor after inserted text
        requestAnimationFrame(() => {
            if (textareaRef.current) {
                const pos = start + (`[[${id}]]`).length;
                textareaRef.current.selectionStart = textareaRef.current.selectionEnd = pos;
                textareaRef.current.focus();
            }
        });
    };

    return (
        <div className="notion-editor-simple">
            <div className="nes-header">
                <input
                    className="nes-title"
                    value={meta.title || note.title || ''}
                    onChange={e => updateMetaKey('title', e.target.value)}
                    placeholder="Title"
                />
                <div className="nes-actions">
                    <button onClick={() => setPreview(p => !p)}>{preview ? 'Edit' : 'Preview'}</button>
                    <button onClick={() => handleSave()}>Save</button>
                </div>
            </div>

            <div className="nes-meta">
                <strong>Metadata</strong>
                <div className="meta-fields">
                    {Object.keys(meta).map(key => (
                        <div className="meta-item" key={key}>
                            <input value={key} readOnly className="meta-key" />
                            <input
                                value={meta[key]}
                                onChange={e => updateMetaKey(key, e.target.value)}
                                className="meta-value"
                            />
                            <button onClick={() => removeMetaField(key)}>✕</button>
                        </div>
                    ))}
                    <div className="meta-add">
                        <button onClick={addMetaField}>+ Add field</button>
                    </div>
                </div>
            </div>

            <div className="nes-editor-area">
                {!preview ? (
                    <textarea
                        ref={textareaRef}
                        value={raw}
                        onChange={e => setRaw(e.target.value)}
                        className="nes-textarea"
                        spellCheck={false}
                    />
                ) : (
                    <div
                        className="nes-preview"
                        dangerouslySetInnerHTML={{ __html: safeRender(raw) }}
                    />
                )}
            </div>

            <div className="nes-footer">
                <button onClick={() => insertReferenceAtCursor('example-note')}>Insert [[example-note]]</button>
            </div>
        </div>
    );
};

export default NotionEditorSimple;

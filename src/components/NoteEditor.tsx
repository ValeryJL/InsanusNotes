import type { ChangeEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import PropertyManager from "@/components/PropertyManager";
import CommandMenu from "@/components/CommandMenu";
import TableView from "@/components/TableView";
import type { Collection, Note, PropertyDefinition } from "@/types/database";
import type { ContentBlock, ContentBlockType, Property, PropertyType } from "@/types";

type NoteEditorProps = {
  note: Note | null;
  schema: PropertyDefinition[] | null;
  schemaValues: Record<string, unknown>;
  blocks: ContentBlock[];
  collections: Collection[];
  title: string;
  contentText: string;
  isSaving: boolean;
  properties: Property[];
  newPropertyLabel: string;
  newPropertyType: PropertyType;
  statusMessage: string;
  onBlocksChange: (blocks: ContentBlock[]) => void;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onNewPropertyLabelChange: (value: string) => void;
  onNewPropertyTypeChange: (value: PropertyType) => void;
  onCreateProperty: () => void;
  onPropertyValueChange: (propertyId: string, value: string) => void;
  onSchemaValueChange: (
    propertyId: string,
    value: string | boolean | string[],
  ) => void;
  onCreateNote: () => void;
  onDeleteNote: () => void;
  onNavigateToNote?: (noteId: string) => void;
  backlinks?: Note[];
};

/**
 * Notion-style editor layout with title, properties, and content.
 */
export default function NoteEditor({
  note,
  schema,
  schemaValues,
  blocks,
  collections,
  title,
  contentText,
  isSaving,
  properties,
  newPropertyLabel,
  newPropertyType,
  statusMessage,
  onBlocksChange,
  onTitleChange,
  onContentChange,
  onNewPropertyLabelChange,
  onNewPropertyTypeChange,
  onCreateProperty,
  onPropertyValueChange,
  onSchemaValueChange,
  onCreateNote,
  onDeleteNote,
  onNavigateToNote,
  backlinks = [],
}: NoteEditorProps) {
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(true);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [commandPosition, setCommandPosition] = useState<
    { x: number; y: number } | null
  >(null);
  const [slashContext, setSlashContext] = useState<
    { lineIndex: number; lineText: string } | null
  >(null);
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const blockRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const availableCollections = useMemo(() => collections, [collections]);

  const removeSlashTrigger = (value: string) => {
    const lastIndex = value.lastIndexOf("/");
    if (lastIndex === -1) {
      return value;
    }

    return `${value.slice(0, lastIndex)}${value.slice(lastIndex + 1)}`;
  };

  const handleContentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value;
    onContentChange(nextValue);

    const selectionStart = event.target.selectionStart ?? nextValue.length;
    const justTypedSlash = nextValue[selectionStart - 1] === "/";

    if (justTypedSlash) {
      const beforeCursor = nextValue.slice(0, selectionStart);
      const lineIndex = beforeCursor.split("\n").length - 1;
      const lines = nextValue.split("\n");
      const lineText = lines[lineIndex] ?? "";
      setSlashContext({ lineIndex, lineText });

      const textareaRect = event.target.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      const lineHeight = 24;
      if (containerRect) {
        const lineOffset = (lineIndex + 1) * lineHeight;
        setCommandPosition({
          x: textareaRect.left - containerRect.left + 12,
          y: textareaRect.top - containerRect.top + lineOffset,
        });
      }

      setIsCommandOpen(true);
      return;
    }

    if (isCommandOpen) {
      setIsCommandOpen(false);
    }
  };

  const transformCurrentLine = (
    type: ContentBlockType,
    collectionId?: string,
  ) => {
    // Check if we're transforming an existing block
    if (slashContext && slashContext.lineIndex >= 0 && slashContext.lineIndex < blocks.length) {
      // Redefining an existing block
      const blockIndex = slashContext.lineIndex;
      const nextBlocks = blocks.map((block, idx) => {
        if (idx === blockIndex) {
          return {
            ...block,
            type,
            text: type === "collection_view" ? undefined : block.text,
            collectionId: type === "collection_view" ? collectionId : undefined,
          };
        }
        return block;
      });
      
      onBlocksChange(nextBlocks);
      setIsCommandOpen(false);
      setSlashContext(null);
      
      if (type !== "collection_view") {
        setPendingFocusId(blocks[blockIndex].id);
      }
      return;
    }
    
    // Original logic for creating new blocks from textarea
    const lines = contentText.split("\n");
    const targetIndex = slashContext?.lineIndex ?? lines.length - 1;
    const rawLine = slashContext?.lineText ?? lines[targetIndex] ?? "";
    const cleanLine = rawLine.replace(/\/[\w-]*$/, "").trim();
    const nextText = lines.filter((_, index) => index !== targetIndex).join("\n");

    const nextBlock: ContentBlock = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `block-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type,
      text: type === "collection_view" ? undefined : cleanLine,
      collectionId,
    };

    onBlocksChange([...blocks, nextBlock]);
    onContentChange(removeSlashTrigger(nextText));
    setIsCommandOpen(false);
    setSlashContext(null);

    if (type === "collection_view") {
      textareaRef.current?.focus();
      return;
    }

    setPendingFocusId(nextBlock.id);
  };

  const handleCommandSelect = (
    type: ContentBlockType,
    collectionId?: string,
  ) => {
    transformCurrentLine(type, collectionId);
  };

  const handleBlockTextChange = (blockId: string, value: string) => {
    onBlocksChange(
      blocks.map((block) =>
        block.id === blockId ? { ...block, text: value } : block,
      ),
    );
  };

  const handleRemoveBlock = (blockId: string) => {
    onBlocksChange(blocks.filter((b) => b.id !== blockId));
  };
    blockId: string,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    const blockIndex = blocks.findIndex((b) => b.id === blockId);
    
    if (event.key === "Enter") {
      event.preventDefault();
      
      // Create new text block below
      const newBlock: ContentBlock = {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `block-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        type: "paragraph",
        text: "",
      };
      
      const nextBlocks = [...blocks];
      nextBlocks.splice(blockIndex + 1, 0, newBlock);
      onBlocksChange(nextBlocks);
      setPendingFocusId(newBlock.id);
    } else if (event.key === "Backspace") {
      const currentBlock = blocks[blockIndex];
      
      // Only delete if block is empty
      if (!currentBlock.text || currentBlock.text.trim() === "") {
        event.preventDefault();
        
        // Remove the current block
        const nextBlocks = blocks.filter((b) => b.id !== blockId);
        onBlocksChange(nextBlocks);
        
        // Focus previous block if it exists
        if (blockIndex > 0) {
          const prevBlockId = blocks[blockIndex - 1].id;
          setPendingFocusId(prevBlockId);
        } else {
          // Focus textarea if no previous block
          textareaRef.current?.focus();
        }
      }
    } else if (event.key === "/" && event.currentTarget.value === "") {
      // Allow "/" to redefine empty blocks
      event.preventDefault();
      
      const currentBlock = blocks[blockIndex];
      const textareaRect = event.currentTarget.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      
      if (containerRect) {
        setCommandPosition({
          x: textareaRect.left - containerRect.left,
          y: textareaRect.bottom - containerRect.top,
        });
      }
      
      setSlashContext({ lineIndex: blockIndex, lineText: "" });
      setIsCommandOpen(true);
    }
  };

  useEffect(() => {
    if (!pendingFocusId) {
      return;
    }

    const target = blockRefs.current[pendingFocusId];
    if (target) {
      target.focus();
      target.selectionStart = target.value.length;
      target.selectionEnd = target.value.length;
      setPendingFocusId(null);
    }
  }, [pendingFocusId]);
  if (!note) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">
          Sin nota seleccionada
        </p>
        <p className="mt-3 text-lg text-zinc-600">
          {statusMessage || "Selecciona una nota o crea una nueva."}
        </p>
        <button
          type="button"
          onClick={onCreateNote}
          className="mt-6 rounded-full border border-zinc-200 px-5 py-2 text-sm text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
        >
          Crear nota
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative flex h-full flex-col">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
          Editor
        </p>
        <div className="flex items-center gap-4">
          <span className="text-xs text-zinc-400">
            {isSaving ? "Guardando..." : "Todo guardado"}
          </span>
          <button
            type="button"
            onClick={() => setIsPropertiesOpen((prev) => !prev)}
            className="text-xs text-zinc-500 transition hover:text-zinc-700"
          >
            Propiedades
          </button>
          <button
            type="button"
            onClick={onDeleteNote}
            className="text-xs text-red-500 transition hover:text-red-600"
          >
            Eliminar
          </button>
        </div>
      </div>
      <input
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        placeholder="Titulo de la nota"
        className="mt-6 border-0 border-b border-transparent bg-transparent text-3xl font-semibold text-zinc-900 outline-none transition focus:border-zinc-200"
      />
      {isPropertiesOpen ? (
        <PropertyManager
          note={note}
          schema={schema}
          schemaValues={schemaValues}
          properties={properties}
          newPropertyLabel={newPropertyLabel}
          newPropertyType={newPropertyType}
          onNewPropertyLabelChange={onNewPropertyLabelChange}
          onNewPropertyTypeChange={onNewPropertyTypeChange}
          onCreateProperty={onCreateProperty}
          onPropertyValueChange={onPropertyValueChange}
          onSchemaValueChange={onSchemaValueChange}
          onNavigateToNote={onNavigateToNote}
        />
      ) : null}
      <textarea
        ref={textareaRef}
        value={contentText}
        onChange={handleContentChange}
        placeholder="Escribe tu contenido aqui..."
        className="mt-6 min-h-[420px] flex-1 resize-none border-0 bg-transparent text-base leading-7 text-zinc-700 outline-none"
      />
      <CommandMenu
        isOpen={isCommandOpen}
        collections={availableCollections}
        position={commandPosition}
        onSelect={handleCommandSelect}
        onClose={() => setIsCommandOpen(false)}
      />
      {blocks.length > 0 ? (
        <section className="mt-4 space-y-2">
          {blocks.map((block) => {
            if (block.type === "collection_view" && block.collectionId) {
              return (
                <div key={block.id}>
                  <TableView
                    collectionId={block.collectionId}
                    variant="embedded"
                    onNavigateToNote={onNavigateToNote}
                    onRemoveBlock={() => handleRemoveBlock(block.id)}
                  />
                </div>
              );
            }

            if (block.type === "heading1") {
              return (
                <input
                  key={block.id}
                  ref={(node) => {
                    blockRefs.current[block.id] = node;
                  }}
                  value={block.text ?? ""}
                  onChange={(event) =>
                    handleBlockTextChange(block.id, event.target.value)
                  }
                  onKeyDown={(event) => handleBlockKeyDown(block.id, event)}
                  placeholder="Encabezado 1"
                  className="w-full border-0 bg-transparent text-2xl font-semibold text-zinc-900 outline-none"
                />
              );
            }

            if (block.type === "heading2") {
              return (
                <input
                  key={block.id}
                  ref={(node) => {
                    blockRefs.current[block.id] = node;
                  }}
                  value={block.text ?? ""}
                  onChange={(event) =>
                    handleBlockTextChange(block.id, event.target.value)
                  }
                  onKeyDown={(event) => handleBlockKeyDown(block.id, event)}
                  placeholder="Encabezado 2"
                  className="w-full border-0 bg-transparent text-xl font-semibold text-zinc-900 outline-none"
                />
              );
            }

            return (
              <input
                key={block.id}
                ref={(node) => {
                  blockRefs.current[block.id] = node;
                }}
                value={block.text ?? ""}
                onChange={(event) =>
                  handleBlockTextChange(block.id, event.target.value)
                }
                onKeyDown={(event) => handleBlockKeyDown(block.id, event)}
                placeholder="Texto"
                className="w-full border-0 bg-transparent text-base text-zinc-700 outline-none"
              />
            );
          })}
        </section>
      ) : null}
      {backlinks.length > 0 ? (
        <section className="mt-10 border-t border-zinc-200 pt-6">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
            Vinculos a esta pagina
          </p>
          <div className="mt-3 space-y-2">
            {backlinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => onNavigateToNote?.(link.id)}
                className="flex w-full items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-left text-sm text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
              >
                <span className="font-medium">
                  {link.icon ? `${link.icon} ` : ""}
                  {link.title || "Sin titulo"}
                </span>
                <span className="text-xs text-zinc-400">Abrir</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

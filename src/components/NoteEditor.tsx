import { useMemo, useState } from "react";
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
  onSchemaValueChange: (propertyId: string, value: string | boolean) => void;
  onCreateNote: () => void;
  onDeleteNote: () => void;
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
}: NoteEditorProps) {
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(true);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  const availableCollections = useMemo(() => collections, [collections]);

  const removeSlashTrigger = (value: string) => {
    const lastIndex = value.lastIndexOf("/");
    if (lastIndex === -1) {
      return value;
    }

    return `${value.slice(0, lastIndex)}${value.slice(lastIndex + 1)}`;
  };

  const handleContentChange = (nextValue: string) => {
    onContentChange(nextValue);
    if (nextValue.endsWith("/")) {
      setIsCommandOpen(true);
      return;
    }

    if (isCommandOpen) {
      setIsCommandOpen(false);
    }
  };

  const handleCommandSelect = (
    type: ContentBlockType,
    collectionId?: string,
  ) => {
    const nextBlock: ContentBlock = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `block-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type,
      text: type === "collection_view" ? undefined : "",
      collectionId,
    };

    onBlocksChange([...blocks, nextBlock]);
    onContentChange(removeSlashTrigger(contentText));
    setIsCommandOpen(false);
  };

  const handleBlockTextChange = (blockId: string, value: string) => {
    onBlocksChange(
      blocks.map((block) =>
        block.id === blockId ? { ...block, text: value } : block,
      ),
    );
  };
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
    <div className="relative flex h-full flex-col">
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
        />
      ) : null}
      <textarea
        value={contentText}
        onChange={(event) => handleContentChange(event.target.value)}
        placeholder="Escribe tu contenido aqui..."
        className="mt-6 min-h-[420px] flex-1 resize-none border-0 bg-transparent text-base leading-7 text-zinc-700 outline-none"
      />
      <CommandMenu
        isOpen={isCommandOpen}
        collections={availableCollections}
        onSelect={handleCommandSelect}
        onClose={() => setIsCommandOpen(false)}
      />
      {blocks.length > 0 ? (
        <section className="mt-8 space-y-4">
          {blocks.map((block) => {
            if (block.type === "collection_view" && block.collectionId) {
              return (
                <div key={block.id}>
                  <TableView
                    collectionId={block.collectionId}
                    variant="embedded"
                  />
                </div>
              );
            }

            if (block.type === "heading1") {
              return (
                <input
                  key={block.id}
                  value={block.text ?? ""}
                  onChange={(event) =>
                    handleBlockTextChange(block.id, event.target.value)
                  }
                  placeholder="Encabezado"
                  className="w-full border-0 bg-transparent text-2xl font-semibold text-zinc-900 outline-none"
                />
              );
            }

            if (block.type === "heading2") {
              return (
                <input
                  key={block.id}
                  value={block.text ?? ""}
                  onChange={(event) =>
                    handleBlockTextChange(block.id, event.target.value)
                  }
                  placeholder="Subtitulo"
                  className="w-full border-0 bg-transparent text-xl font-semibold text-zinc-900 outline-none"
                />
              );
            }

            return (
              <input
                key={block.id}
                value={block.text ?? ""}
                onChange={(event) =>
                  handleBlockTextChange(block.id, event.target.value)
                }
                placeholder="Parrafo"
                className="w-full border-0 bg-transparent text-base text-zinc-700 outline-none"
              />
            );
          })}
        </section>
      ) : null}
    </div>
  );
}

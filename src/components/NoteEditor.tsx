import PropertyManager from "@/components/PropertyManager";
import type { Note, PropertyDefinition } from "@/types/database";
import type { Property, PropertyType } from "@/types";

type NoteEditorProps = {
  note: Note | null;
  schema: PropertyDefinition[] | null;
  schemaValues: Record<string, unknown>;
  title: string;
  contentText: string;
  isSaving: boolean;
  properties: Property[];
  newPropertyLabel: string;
  newPropertyType: PropertyType;
  statusMessage: string;
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
  title,
  contentText,
  isSaving,
  properties,
  newPropertyLabel,
  newPropertyType,
  statusMessage,
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
    <div className="flex h-full flex-col">
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
      <textarea
        value={contentText}
        onChange={(event) => onContentChange(event.target.value)}
        placeholder="Escribe tu contenido aqui..."
        className="mt-6 min-h-[420px] flex-1 resize-none border-0 bg-transparent text-base leading-7 text-zinc-700 outline-none"
      />
    </div>
  );
}

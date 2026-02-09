import PropertyManager from "@/components/PropertyManager";
import { Note, Property, PropertyType } from "@/types";

type NoteEditorProps = {
  note: Note | null;
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
  onCreateNote: () => void;
};

export default function NoteEditor({
  note,
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
  onCreateNote,
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
        <span className="text-xs text-zinc-400">
          {isSaving ? "Guardando..." : "Todo guardado"}
        </span>
      </div>
      <input
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        placeholder="Titulo de la nota"
        className="mt-6 border-0 border-b border-transparent bg-transparent text-3xl font-semibold text-zinc-900 outline-none transition focus:border-zinc-200"
      />
      <PropertyManager
        properties={properties}
        newPropertyLabel={newPropertyLabel}
        newPropertyType={newPropertyType}
        onNewPropertyLabelChange={onNewPropertyLabelChange}
        onNewPropertyTypeChange={onNewPropertyTypeChange}
        onCreateProperty={onCreateProperty}
        onPropertyValueChange={onPropertyValueChange}
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

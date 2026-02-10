import type { Note, PropertyDefinition } from "@/types/database";
import type { Property, PropertyType } from "@/types";

type PropertyManagerProps = {
  note: Note | null;
  schema: PropertyDefinition[] | null;
  schemaValues: Record<string, unknown>;
  properties: Property[];
  newPropertyLabel: string;
  newPropertyType: PropertyType;
  onNewPropertyLabelChange: (value: string) => void;
  onNewPropertyTypeChange: (value: PropertyType) => void;
  onCreateProperty: () => void;
  onPropertyValueChange: (propertyId: string, value: string) => void;
  onSchemaValueChange: (propertyId: string, value: string | boolean) => void;
};

const inputClassName =
  "w-full rounded-md border border-transparent bg-zinc-50/70 px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-zinc-200 focus:bg-white";

/**
 * Manages property creation and editing for the selected note.
 */
export default function PropertyManager({
  note,
  schema,
  schemaValues,
  properties,
  newPropertyLabel,
  newPropertyType,
  onNewPropertyLabelChange,
  onNewPropertyTypeChange,
  onCreateProperty,
  onPropertyValueChange,
  onSchemaValueChange,
}: PropertyManagerProps) {
  const isCollectionNote = Boolean(note?.collection_id);
  const activeSchema = schema ?? [];

  return (
    <section className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
          Propiedades
        </p>
      </div>
      {isCollectionNote ? null : (
        <>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-center gap-x-4 gap-y-3">
            <label className="text-xs font-medium text-zinc-500">Nombre</label>
            <input
              value={newPropertyLabel}
              onChange={(event) => onNewPropertyLabelChange(event.target.value)}
              placeholder="Nombre de propiedad"
              className={inputClassName}
            />
            <label className="text-xs font-medium text-zinc-500">Tipo</label>
            <select
              value={newPropertyType}
              onChange={(event) =>
                onNewPropertyTypeChange(event.target.value as PropertyType)
              }
              className={inputClassName}
            >
              <option value="text">Texto</option>
              <option value="number">Numero</option>
              <option value="date">Fecha</option>
              <option value="status">Estado</option>
            </select>
          </div>
          <button
            type="button"
            onClick={onCreateProperty}
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
          >
            Agregar propiedad
          </button>
        </>
      )}
      {isCollectionNote ? (
        activeSchema.length === 0 ? (
          <p className="text-xs text-zinc-400">Sin propiedades.</p>
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-center gap-x-4 gap-y-3">
            {activeSchema.map((definition) => {
              const rawValue = schemaValues[definition.id];
              const stringValue =
                typeof rawValue === "string" ? rawValue : "";

              if (definition.type === "date") {
                return (
                  <div key={definition.id} className="contents">
                    <p className="text-xs font-medium text-zinc-500">
                      {definition.name}
                    </p>
                    <input
                      type="date"
                      value={stringValue}
                      onChange={(event) =>
                        onSchemaValueChange(definition.id, event.target.value)
                      }
                      className={inputClassName}
                    />
                  </div>
                );
              }

              if (definition.type === "number") {
                return (
                  <div key={definition.id} className="contents">
                    <p className="text-xs font-medium text-zinc-500">
                      {definition.name}
                    </p>
                    <input
                      type="number"
                      value={stringValue}
                      onChange={(event) =>
                        onSchemaValueChange(definition.id, event.target.value)
                      }
                      className={inputClassName}
                    />
                  </div>
                );
              }

              if (definition.type === "bool") {
                return (
                  <div key={definition.id} className="contents">
                    <p className="text-xs font-medium text-zinc-500">
                      {definition.name}
                    </p>
                    <input
                      type="checkbox"
                      checked={Boolean(rawValue)}
                      onChange={(event) =>
                        onSchemaValueChange(definition.id, event.target.checked)
                      }
                      className="h-4 w-4 rounded border-zinc-300 text-zinc-900"
                    />
                  </div>
                );
              }

              if (definition.type === "select") {
                const options = definition.options ?? [];
                return (
                  <div key={definition.id} className="contents">
                    <p className="text-xs font-medium text-zinc-500">
                      {definition.name}
                    </p>
                    <select
                      value={stringValue}
                      onChange={(event) =>
                        onSchemaValueChange(definition.id, event.target.value)
                      }
                      className={inputClassName}
                    >
                      <option value="">Selecciona...</option>
                      {options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              return (
                <div key={definition.id} className="contents">
                  <p className="text-xs font-medium text-zinc-500">
                    {definition.name}
                  </p>
                  <input
                    type="text"
                    value={stringValue}
                    onChange={(event) =>
                      onSchemaValueChange(definition.id, event.target.value)
                    }
                    className={inputClassName}
                  />
                </div>
              );
            })}
          </div>
        )
      ) : properties.length === 0 ? (
        <p className="text-xs text-zinc-400">Sin propiedades.</p>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-center gap-x-4 gap-y-3">
          {properties.map((property) => {
            const value = property.value ?? "";
            const type = property.value_type;

            if (type === "date") {
              return (
                <div key={property.id} className="contents">
                  <p className="text-xs font-medium text-zinc-500">
                    {property.label}
                  </p>
                  <input
                    type="date"
                    value={value}
                    onChange={(event) =>
                      onPropertyValueChange(property.id, event.target.value)
                    }
                    className={inputClassName}
                  />
                </div>
              );
            }

            if (type === "number") {
              return (
                <div key={property.id} className="contents">
                  <p className="text-xs font-medium text-zinc-500">
                    {property.label}
                  </p>
                  <input
                    type="number"
                    value={value}
                    onChange={(event) =>
                      onPropertyValueChange(property.id, event.target.value)
                    }
                    className={inputClassName}
                  />
                </div>
              );
            }

            return (
              <div key={property.id} className="contents">
                <p className="text-xs font-medium text-zinc-500">
                  {property.label}
                </p>
                <input
                  type="text"
                  value={value}
                  onChange={(event) =>
                    onPropertyValueChange(property.id, event.target.value)
                  }
                  className={inputClassName}
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

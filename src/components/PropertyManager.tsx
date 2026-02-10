import { useEffect, useState } from "react";
import { getNotesByIds, searchNotes } from "@/lib/api";
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
  onSchemaValueChange: (
    propertyId: string,
    value: string | boolean | string[],
  ) => void;
  onNavigateToNote?: (noteId: string) => void;
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
  onNavigateToNote,
}: PropertyManagerProps) {
  const isCollectionNote = Boolean(note?.collection_id);
  const activeSchema = schema ?? [];
  const [relationSearch, setRelationSearch] = useState<Record<string, string>>(
    {},
  );
  const [relationResults, setRelationResults] = useState<
    Record<string, Note[]>
  >({});
  const [relationLookup, setRelationLookup] = useState<Record<string, Note>>({});

  useEffect(() => {
    const relationIds = new Set<string>();
    Object.values(schemaValues).forEach((value) => {
      if (Array.isArray(value)) {
        value.forEach((id) => {
          if (typeof id === "string") {
            relationIds.add(id);
          }
        });
      }
    });

    const missing = Array.from(relationIds).filter(
      (id) => !relationLookup[id],
    );
    if (missing.length === 0) {
      return;
    }

    const load = async () => {
      try {
        const results = await getNotesByIds(missing);
        setRelationLookup((prev) => {
          const next = { ...prev };
          results.forEach((item) => {
            next[item.id] = item;
          });
          return next;
        });
      } catch (error) {
        // ignore
      }
    };

    load();
  }, [relationLookup, schemaValues]);

  const handleRelationSearch = async (
    propertyId: string,
    value: string,
    collectionFilter?: string | null,
  ) => {
    setRelationSearch((prev) => ({ ...prev, [propertyId]: value }));
    if (!value.trim()) {
      setRelationResults((prev) => ({ ...prev, [propertyId]: [] }));
      return;
    }

    try {
      const results = await searchNotes(
        value,
        collectionFilter ?? undefined,
        note?.id,
      );
      setRelationResults((prev) => ({ ...prev, [propertyId]: results }));
    } catch (error) {
      setRelationResults((prev) => ({ ...prev, [propertyId]: [] }));
    }
  };

  const addRelationValue = (propertyId: string, noteId: string) => {
    const existing = schemaValues[propertyId];
    const next = Array.isArray(existing) ? existing.slice() : [];
    if (!next.includes(noteId)) {
      next.push(noteId);
    }

    onSchemaValueChange(propertyId, next);
    // Clear search term and close menu
    setRelationSearch((prev) => ({ ...prev, [propertyId]: "" }));
    setRelationResults((prev) => ({ ...prev, [propertyId]: [] }));
  };

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
              <option value="relation">Relacion</option>
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

              if (definition.type === "relation") {
                const relationIds = Array.isArray(rawValue)
                  ? rawValue.filter((id) => typeof id === "string")
                  : [];
                const relationNotes = relationIds.map(
                  (id) => relationLookup[id] ?? { id, title: "" },
                );

                return (
                  <div key={definition.id} className="contents">
                    <p className="text-xs font-medium text-zinc-500">
                      {definition.name}
                    </p>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {relationNotes.map((linked) => (
                          <button
                            key={linked.id}
                            type="button"
                            onClick={() => onNavigateToNote?.(linked.id)}
                            className="inline-flex items-center rounded-full border border-zinc-200 px-2 py-0.5 text-xs text-zinc-600 transition hover:border-zinc-300"
                          >
                            {linked.title || linked.id}
                          </button>
                        ))}
                      </div>
                      <input
                        value={relationSearch[definition.id] ?? ""}
                        onChange={(event) =>
                          handleRelationSearch(
                            definition.id,
                            event.target.value,
                            definition.relation_collection_id,
                          )
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && relationResults[definition.id]?.[0]) {
                            addRelationValue(definition.id, relationResults[definition.id][0].id);
                          }
                        }}
                        placeholder="Buscar nota..."
                        className={inputClassName}
                      />
                      {relationResults[definition.id]?.length ? (
                        <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
                          {relationResults[definition.id].map((result) => (
                            <button
                              key={result.id}
                              type="button"
                              onClick={() =>
                                addRelationValue(definition.id, result.id)
                              }
                              className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-zinc-600 hover:bg-zinc-50"
                            >
                              <span>{result.title || "Sin titulo"}</span>
                              <span className="text-[10px] text-zinc-400">
                                {result.id}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
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

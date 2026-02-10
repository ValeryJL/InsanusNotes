"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createNote,
  getCollectionById,
  getNotes,
  updateCollectionSchema,
} from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { Collection, Note, PropertyDefinition } from "@/types/database";

type TableViewProps = {
  collectionId: string;
  variant?: "page" | "embedded";
};

const tableCellClass =
  "border-b border-zinc-200 px-3 py-2 text-sm text-zinc-700";
const headerCellClass =
  "border-b border-zinc-200 bg-zinc-50/70 px-3 py-2 text-xs uppercase tracking-[0.14em] text-zinc-500";
const inputClassName =
  "w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm text-zinc-700 outline-none transition focus:border-zinc-200 focus:bg-white";

const getPropertiesRecord = (note: Note): Record<string, unknown> => {
  const value = note.properties_jsonb;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
};

const toStringValue = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? `${value}` : "";

export default function TableView({
  collectionId,
  variant = "page",
}: TableViewProps) {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [statusMessage, setStatusMessage] = useState("Cargando...");
  const [isSaving, setIsSaving] = useState(false);
  const [showSchemaForm, setShowSchemaForm] = useState(false);
  const [newPropertyName, setNewPropertyName] = useState("");
  const [newPropertyType, setNewPropertyType] = useState<
    PropertyDefinition["type"]
  >("text");
  const [newPropertyOptions, setNewPropertyOptions] = useState("");

  const schema = useMemo(() => collection?.schema_json ?? [], [collection]);
  const isEmbedded = variant === "embedded";

  useEffect(() => {
    const load = async () => {
      try {
        const [collectionData, noteData] = await Promise.all([
          getCollectionById(collectionId),
          getNotes(collectionId),
        ]);
        setCollection(collectionData);
        setNotes(noteData);
        setStatusMessage("");
      } catch (error) {
        setStatusMessage("No se pudo cargar la coleccion.");
      }
    };

    load();
  }, [collectionId]);

  const handleCreateRow = async () => {
    setIsSaving(true);
    try {
      const newNote = await createNote(collectionId);
      setNotes((prev) => [newNote, ...prev]);
    } catch (error) {
      setStatusMessage("No se pudo crear la nota.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTitleChange = async (noteId: string, value: string) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === noteId ? { ...note, title: value } : note)),
    );

    await supabase.from("notes").update({ title: value }).eq("id", noteId);
  };

  const handleCellChange = async (
    noteId: string,
    propertyId: string,
    value: string | boolean,
  ) => {
    setNotes((prev) =>
      prev.map((note) => {
        if (note.id !== noteId) {
          return note;
        }

        const nextProperties = {
          ...getPropertiesRecord(note),
          [propertyId]: value,
        };

        return { ...note, properties_jsonb: nextProperties };
      }),
    );

    const note = notes.find((item) => item.id === noteId);
    const nextProperties = {
      ...(note ? getPropertiesRecord(note) : {}),
      [propertyId]: value,
    };
    await supabase
      .from("notes")
      .update({ properties_jsonb: nextProperties })
      .eq("id", noteId);
  };

  const handleAddProperty = async () => {
    if (!collection) {
      return;
    }

    const trimmed = newPropertyName.trim();
    if (!trimmed) {
      return;
    }

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `prop-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const options = newPropertyOptions
      .split(",")
      .map((option) => option.trim())
      .filter(Boolean);

    const nextDefinition: PropertyDefinition = {
      id,
      name: trimmed,
      type: newPropertyType,
      options: newPropertyType === "select" ? options : undefined,
    };

    try {
      const updated = await updateCollectionSchema(collection.id, [
        ...schema,
        nextDefinition,
      ]);
      setCollection(updated);
      setNewPropertyName("");
      setNewPropertyType("text");
      setNewPropertyOptions("");
      setShowSchemaForm(false);
    } catch (error) {
      setStatusMessage("No se pudo actualizar el esquema.");
    }
  };

  if (!collectionId) {
    return (
      <div className="p-10 text-sm text-zinc-500">
        Coleccion no encontrada.
      </div>
    );
  }

  return (
    <div className={isEmbedded ? "mt-6" : "min-h-screen bg-white px-10 py-12 text-zinc-900"}>
      {isEmbedded ? null : (
        <header className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              Base de datos
            </p>
            <h1 className="mt-2 text-2xl font-semibold">
              {collection?.name ?? "Coleccion"}
            </h1>
            {collection?.description ? (
              <p className="mt-2 text-sm text-zinc-500">
                {collection.description}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowSchemaForm((prev) => !prev)}
              className="rounded-full border border-zinc-200 px-4 py-2 text-xs text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
            >
              Gestionar propiedades
            </button>
            <button
              type="button"
              onClick={handleCreateRow}
              className="rounded-full border border-zinc-200 px-4 py-2 text-xs text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
            >
              Nueva fila
            </button>
          </div>
        </header>
      )}

      {showSchemaForm && !isEmbedded ? (
        <section className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50/40 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
            Agregar propiedad
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              value={newPropertyName}
              onChange={(event) => setNewPropertyName(event.target.value)}
              placeholder="Nombre"
              className={inputClassName}
            />
            <select
              value={newPropertyType}
              onChange={(event) =>
                setNewPropertyType(
                  event.target.value as PropertyDefinition["type"],
                )
              }
              className={inputClassName}
            >
              <option value="text">Texto</option>
              <option value="number">Numero</option>
              <option value="date">Fecha</option>
              <option value="bool">Bool</option>
              <option value="select">Select</option>
            </select>
            {newPropertyType === "select" ? (
              <input
                value={newPropertyOptions}
                onChange={(event) => setNewPropertyOptions(event.target.value)}
                placeholder="Opciones (comma)"
                className={inputClassName}
              />
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleAddProperty}
            className="mt-4 rounded-full border border-zinc-200 px-4 py-2 text-xs text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
          >
            Guardar cambios
          </button>
        </section>
      ) : null}

      {statusMessage ? (
        <p className={isEmbedded ? "mt-4 text-xs text-zinc-400" : "mt-6 text-sm text-zinc-400"}>
          {statusMessage}
        </p>
      ) : null}

      <div className={isEmbedded ? "mt-4 overflow-auto rounded-xl border border-zinc-200" : "mt-6 overflow-auto rounded-xl border border-zinc-200"}>
        <table className="min-w-full border-collapse text-left">
          <thead>
            <tr>
              <th className={headerCellClass}>Titulo</th>
              {schema.map((definition) => (
                <th key={definition.id} className={headerCellClass}>
                  {definition.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {notes.map((note) => {
              const values = getPropertiesRecord(note);

              return (
                <tr key={note.id} className="odd:bg-white even:bg-zinc-50/30">
                  <td className={tableCellClass}>
                    <input
                      value={note.title ?? ""}
                      onChange={(event) =>
                        handleTitleChange(note.id, event.target.value)
                      }
                      className={inputClassName}
                    />
                  </td>
                  {schema.map((definition) => {
                    const rawValue = values[definition.id];
                    const stringValue = toStringValue(rawValue);

                    if (definition.type === "bool") {
                      return (
                        <td key={definition.id} className={tableCellClass}>
                          <input
                            type="checkbox"
                            checked={Boolean(rawValue)}
                            onChange={(event) =>
                              handleCellChange(
                                note.id,
                                definition.id,
                                event.target.checked,
                              )
                            }
                            className="h-4 w-4 rounded border-zinc-300 text-zinc-900"
                          />
                        </td>
                      );
                    }

                    if (definition.type === "select") {
                      return (
                        <td key={definition.id} className={tableCellClass}>
                          <select
                            value={stringValue}
                            onChange={(event) =>
                              handleCellChange(
                                note.id,
                                definition.id,
                                event.target.value,
                              )
                            }
                            className={inputClassName}
                          >
                            <option value="">Selecciona...</option>
                            {(definition.options ?? []).map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>
                      );
                    }

                    return (
                      <td key={definition.id} className={tableCellClass}>
                        <input
                          type={definition.type === "date" ? "date" : "text"}
                          value={stringValue}
                          onChange={(event) =>
                            handleCellChange(
                              note.id,
                              definition.id,
                              event.target.value,
                            )
                          }
                          className={inputClassName}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isSaving ? (
        <p className={isEmbedded ? "mt-3 text-xs text-zinc-400" : "mt-4 text-xs text-zinc-400"}>
          Guardando...
        </p>
      ) : null}

      {isEmbedded ? (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            {collection?.name ?? "Coleccion"}
          </p>
          <button
            type="button"
            onClick={handleCreateRow}
            className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
          >
            Nueva fila
          </button>
        </div>
      ) : null}
    </div>
  );
}

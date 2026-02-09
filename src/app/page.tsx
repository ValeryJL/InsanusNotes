"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type NoteContent = {
  text?: string;
  [key: string]: unknown;
};

type Note = {
  id: string;
  title: string;
  content: NoteContent | null;
};

type PropertyType = "text" | "number" | "date" | "status";

type Property = {
  id: string;
  page_id: string | null;
  label: string;
  value_type: PropertyType | null;
  value: string | null;
};

const EMPTY_CONTENT: NoteContent = { text: "" };

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [contentText, setContentText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Cargando...");
  const [properties, setProperties] = useState<Property[]>([]);
  const [newPropertyLabel, setNewPropertyLabel] = useState("");
  const [newPropertyType, setNewPropertyType] = useState<PropertyType>("text");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const propertyTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedId) ?? null,
    [notes, selectedId],
  );

  useEffect(() => {
    const loadNotes = async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("id, title, content")
        .order("id", { ascending: true });

      if (error) {
        setStatusMessage("No se pudieron cargar las notas.");
        return;
      }

      const nextNotes = (data ?? []) as Note[];
      setNotes(nextNotes);
      if (nextNotes.length > 0) {
        setSelectedId(nextNotes[0].id);
        setStatusMessage("");
      } else {
        setStatusMessage("Crea tu primera nota.");
      }
    };

    loadNotes();
  }, []);

  useEffect(() => {
    const loadProperties = async () => {
      if (!selectedId) {
        setProperties([]);
        return;
      }

      const { data, error } = await supabase
        .from("custom_attributes")
        .select("id, page_id, label, value_type, value")
        .eq("page_id", selectedId)
        .order("label", { ascending: true });

      if (error) {
        return;
      }

      setProperties((data ?? []) as Property[]);
    };

    loadProperties();
  }, [selectedId]);

  useEffect(() => {
    if (!selectedNote) {
      setTitle("");
      setContentText("");
      return;
    }

    const nextTitle = selectedNote.title ?? "";
    const nextContent = selectedNote.content ?? EMPTY_CONTENT;
    const nextText = typeof nextContent.text === "string" ? nextContent.text : "";

    setTitle(nextTitle);
    setContentText(nextText);
  }, [selectedNote?.id]);

  useEffect(() => {
    if (!selectedNote) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      const baseContent = selectedNote.content ?? EMPTY_CONTENT;
      const payload = {
        title: title.trim() || "Sin titulo",
        content: { ...baseContent, text: contentText },
      };

      const { data, error } = await supabase
        .from("pages")
        .update(payload)
        .eq("id", selectedNote.id)
        .select("id, title, content")
        .single();

      if (!error && data) {
        setNotes((prev) =>
          prev.map((note) => (note.id === data.id ? (data as Note) : note)),
        );
      }

      setIsSaving(false);
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, contentText, selectedNote]);

  const handleCreateProperty = async () => {
    if (!selectedId) {
      return;
    }

    const trimmedLabel = newPropertyLabel.trim();
    if (!trimmedLabel) {
      return;
    }

    const { data, error } = await supabase
      .from("custom_attributes")
      .insert({
        page_id: selectedId,
        label: trimmedLabel,
        value_type: newPropertyType,
        value: "",
      })
      .select("id, page_id, label, value_type, value")
      .single();

    if (error || !data) {
      return;
    }

    setProperties((prev) => [data as Property, ...prev]);
    setNewPropertyLabel("");
    setNewPropertyType("text");
  };

  const schedulePropertySave = (propertyId: string, value: string) => {
    const existing = propertyTimeoutsRef.current[propertyId];
    if (existing) {
      clearTimeout(existing);
    }

    propertyTimeoutsRef.current[propertyId] = setTimeout(async () => {
      await supabase
        .from("custom_attributes")
        .update({ value })
        .eq("id", propertyId);
    }, 1500);
  };

  const handlePropertyValueChange = (propertyId: string, value: string) => {
    setProperties((prev) =>
      prev.map((property) =>
        property.id === propertyId ? { ...property, value } : property,
      ),
    );
    schedulePropertySave(propertyId, value);
  };

  const handleCreateNote = async () => {
    setIsSaving(true);
    const { data, error } = await supabase
      .from("pages")
      .insert({ title: "Sin titulo", content: EMPTY_CONTENT })
      .select("id, title, content")
      .single();

    setIsSaving(false);

    if (error || !data) {
      setStatusMessage("No se pudo crear la nota.");
      return;
    }

    const newNote = data as Note;
    setNotes((prev) => [newNote, ...prev]);
    setSelectedId(newNote.id);
    setStatusMessage("");
  };

  return (
    <div className="flex min-h-screen bg-white text-zinc-900">
      <aside className="flex w-72 flex-col border-r border-zinc-200 bg-white">
        <div className="flex items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              Insanus Notes
            </p>
            <h1 className="text-lg font-semibold">Notas</h1>
          </div>
          <button
            type="button"
            onClick={handleCreateNote}
            className="rounded-full border border-zinc-200 px-3 py-1 text-sm text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
          >
            Nueva
          </button>
        </div>
        <div className="px-3">
          {notes.length === 0 ? (
            <p className="px-3 py-6 text-sm text-zinc-400">{statusMessage}</p>
          ) : (
            <ul className="space-y-1">
              {notes.map((note) => (
                <li key={note.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(note.id)}
                    className={`flex w-full flex-col rounded-lg px-4 py-3 text-left transition ${
                      selectedId === note.id
                        ? "bg-zinc-100 text-zinc-900"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-800"
                    }`}
                  >
                    <span className="text-sm font-medium">
                      {note.title || "Sin titulo"}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {typeof note.content?.text === "string"
                        ? note.content.text.slice(0, 48) || "Sin contenido"
                        : "Sin contenido"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-6 border-t border-zinc-200 px-6 py-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              Propiedades
            </p>
          </div>
          {selectedNote ? (
            <div className="mt-4 space-y-3">
              <div className="space-y-2">
                <input
                  value={newPropertyLabel}
                  onChange={(event) => setNewPropertyLabel(event.target.value)}
                  placeholder="Nombre de propiedad"
                  className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-zinc-300"
                />
                <select
                  value={newPropertyType}
                  onChange={(event) =>
                    setNewPropertyType(event.target.value as PropertyType)
                  }
                  className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-zinc-300"
                >
                  <option value="text">Texto</option>
                  <option value="number">Numero</option>
                  <option value="date">Fecha</option>
                  <option value="status">Estado</option>
                </select>
                <button
                  type="button"
                  onClick={handleCreateProperty}
                  className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
                >
                  Agregar propiedad
                </button>
              </div>
              {properties.length === 0 ? (
                <p className="text-xs text-zinc-400">Sin propiedades.</p>
              ) : (
                <div className="space-y-3">
                  {properties.map((property) => (
                    <div key={property.id} className="space-y-1">
                      <p className="text-xs font-medium text-zinc-500">
                        {property.label}
                      </p>
                      {property.value_type === "date" ? (
                        <input
                          type="date"
                          value={property.value ?? ""}
                          onChange={(event) =>
                            handlePropertyValueChange(
                              property.id,
                              event.target.value,
                            )
                          }
                          className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-zinc-300"
                        />
                      ) : property.value_type === "number" ? (
                        <input
                          type="number"
                          value={property.value ?? ""}
                          onChange={(event) =>
                            handlePropertyValueChange(
                              property.id,
                              event.target.value,
                            )
                          }
                          className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-zinc-300"
                        />
                      ) : (
                        <input
                          type="text"
                          value={property.value ?? ""}
                          onChange={(event) =>
                            handlePropertyValueChange(
                              property.id,
                              event.target.value,
                            )
                          }
                          className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-zinc-300"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="mt-3 text-xs text-zinc-400">
              Selecciona una nota para editar propiedades.
            </p>
          )}
        </div>
      </aside>

      <main className="flex flex-1 flex-col px-10 py-12">
        {selectedNote ? (
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
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Titulo de la nota"
              className="mt-6 border-0 border-b border-transparent bg-transparent text-3xl font-semibold text-zinc-900 outline-none transition focus:border-zinc-200"
            />
            <textarea
              value={contentText}
              onChange={(event) => setContentText(event.target.value)}
              placeholder="Escribe tu contenido aqui..."
              className="mt-6 min-h-[420px] flex-1 resize-none border-0 bg-transparent text-base leading-7 text-zinc-700 outline-none"
            />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">
              Sin nota seleccionada
            </p>
            <p className="mt-3 text-lg text-zinc-600">
              {statusMessage || "Selecciona una nota o crea una nueva."}
            </p>
            <button
              type="button"
              onClick={handleCreateNote}
              className="mt-6 rounded-full border border-zinc-200 px-5 py-2 text-sm text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
            >
              Crear nota
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

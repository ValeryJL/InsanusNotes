"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type NoteContent = {
  text?: string;
  [key: string]: unknown;
};

type Note = {
  id: number;
  title: string;
  content: NoteContent | null;
};

const EMPTY_CONTENT: NoteContent = { text: "" };

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [contentText, setContentText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Cargando...");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

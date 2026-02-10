"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createCollection, createNote, getCollections, getNotes } from "@/lib/api";
import type { Collection, Note } from "@/types/database";

type SidebarProps = {
  notes: Note[];
  collections: Collection[];
  selectedNoteId: string | null;
  statusMessage: string;
  onSelectNote: (id: string) => void;
  onNotesLoaded: (notes: Note[]) => void;
  onCollectionsLoaded: (collections: Collection[]) => void;
  onStatusMessageChange?: (message: string) => void;
};

const getNotePreview = (note: Note) => {
  const content = note.content_jsonb;
  if (content && typeof content === "object" && "text" in content) {
    const text = (content as { text?: string }).text;
    if (typeof text === "string") {
      return text.slice(0, 48) || "Sin contenido";
    }
  }

  return "Sin contenido";
};

/**
 * Renders the notes list and database collections for navigation.
 */
export default function Sidebar({
  notes,
  collections,
  selectedNoteId,
  statusMessage,
  onSelectNote,
  onNotesLoaded,
  onCollectionsLoaded,
  onStatusMessageChange,
}: SidebarProps) {
  const [collectionsStatus, setCollectionsStatus] = useState("Cargando...");
  const isNotesEmpty = notes.length === 0;
  const isCollectionsEmpty = collections.length === 0;

  const orderedNotes = useMemo(() => notes, [notes]);
  const orderedCollections = useMemo(() => collections, [collections]);

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const data = await getNotes(null);
        onNotesLoaded(data);

        if (data.length === 0) {
          onStatusMessageChange?.("Crea tu primera nota.");
        } else {
          onStatusMessageChange?.("");
        }
      } catch (error) {
        onStatusMessageChange?.("No se pudieron cargar las notas.");
      }
    };

    const loadCollections = async () => {
      try {
        const data = await getCollections();
        onCollectionsLoaded(data);
        setCollectionsStatus(data.length === 0 ? "Sin colecciones." : "");
      } catch (error) {
        setCollectionsStatus("No se pudieron cargar las colecciones.");
      }
    };

    loadNotes();
    loadCollections();
  }, [onCollectionsLoaded, onNotesLoaded, onStatusMessageChange]);

  const handleCreateNote = async () => {
    try {
      const newNote = await createNote(null);
      onNotesLoaded([newNote, ...notes]);
      onSelectNote(newNote.id);
      onStatusMessageChange?.("");
    } catch (error) {
      onStatusMessageChange?.("No se pudo crear la nota.");
    }
  };

  const handleCreateCollection = async () => {
    const name = window.prompt("Nombre de la coleccion");
    const trimmed = name?.trim();
    if (!trimmed) {
      return;
    }

    try {
      const collection = await createCollection(trimmed);
      onCollectionsLoaded([collection, ...collections]);
      setCollectionsStatus("");
    } catch (error) {
      setCollectionsStatus("No se pudo crear la coleccion.");
    }
  };

  return (
    <aside className="flex w-72 flex-col border-r border-zinc-200 bg-white">
      <div className="px-6 py-5">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
          Insanus Notes
        </p>
        <h1 className="text-lg font-semibold">Navegacion</h1>
      </div>
      <section className="space-y-3">
        <div className="flex items-center justify-between px-6">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
            Mis notas
          </p>
          <button
            type="button"
            onClick={handleCreateNote}
            className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
          >
            Nueva nota libre
          </button>
        </div>
        <div className="px-3">
          {isNotesEmpty ? (
            <p className="px-3 py-6 text-sm text-zinc-400">
              {statusMessage || "Sin notas libres."}
            </p>
          ) : (
            <ul className="space-y-1">
              {orderedNotes.map((note) => (
                <li key={note.id}>
                  <button
                    type="button"
                    onClick={() => onSelectNote(note.id)}
                    className={`flex w-full flex-col rounded-lg px-4 py-3 text-left transition ${
                      selectedNoteId === note.id
                        ? "bg-zinc-100 text-zinc-900"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-800"
                    }`}
                  >
                    <span className="text-sm font-medium">
                      {note.title || "Sin titulo"}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {getNotePreview(note)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <section className="mt-6 space-y-3">
        <div className="flex items-center justify-between px-6">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
            Bases de datos
          </p>
          <button
            type="button"
            onClick={handleCreateCollection}
            className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
          >
            Nueva coleccion
          </button>
        </div>
        <div className="px-3">
          {isCollectionsEmpty ? (
            <p className="px-3 py-6 text-sm text-zinc-400">
              {collectionsStatus || "Sin colecciones."}
            </p>
          ) : (
            <ul className="space-y-1">
              {orderedCollections.map((collection) => (
                <li key={collection.id}>
                  <Link
                    href={`/collection/${collection.id}`}
                    className="flex flex-col rounded-lg px-4 py-3 text-left text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-800"
                  >
                    <span className="text-sm font-medium text-zinc-900">
                      {collection.icon ? `${collection.icon} ` : ""}
                      {collection.name}
                    </span>
                    {collection.description ? (
                      <span className="text-xs text-zinc-400">
                        {collection.description}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </aside>
  );
}

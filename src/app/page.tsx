"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NoteEditor from "@/components/NoteEditor";
import Sidebar from "@/components/Sidebar";
import { createNote } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { Collection, Note as DbNote } from "@/types/database";
import type { Property, PropertyType } from "@/types";

type NoteContent = {
  text?: string;
  [key: string]: unknown;
};

const EMPTY_CONTENT: NoteContent = { text: "" };

const normalizeProperties = (value: unknown): Property[] =>
  Array.isArray(value) ? (value as Property[]) : [];

export default function Home() {
  const [notes, setNotes] = useState<DbNote[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [contentText, setContentText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Cargando...");
  const [properties, setProperties] = useState<Property[]>([]);
  const [newPropertyLabel, setNewPropertyLabel] = useState("");
  const [newPropertyType, setNewPropertyType] = useState<PropertyType>("text");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedId) ?? null,
    [notes, selectedId],
  );

  const applyNoteToEditor = (note: DbNote | null) => {
    if (!note) {
      setTitle("");
      setContentText("");
      return;
    }

    const nextTitle = note.title ?? "";
    const nextContent = (note.content_jsonb ?? EMPTY_CONTENT) as NoteContent;
    const nextText = typeof nextContent.text === "string" ? nextContent.text : "";

    setTitle(nextTitle);
    setContentText(nextText);
  };

  const handleSelectNote = useCallback(
    (id: string) => {
      setSelectedId(id);
      applyNoteToEditor(notes.find((note) => note.id === id) ?? null);
    },
    [notes],
  );

  useEffect(() => {
    if (!selectedNote) {
      setProperties([]);
      return;
    }

    setProperties(normalizeProperties(selectedNote.properties_jsonb));
  }, [selectedNote]);

  useEffect(() => {
    if (!selectedNote) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      const baseContent =
        (selectedNote.content_jsonb ?? EMPTY_CONTENT) as NoteContent;
      const payload = {
        title: title.trim() || "Sin titulo",
        content_jsonb: { ...baseContent, text: contentText },
        properties_jsonb: properties,
      };

      const { data, error } = await supabase
        .from("notes")
        .update(payload)
        .eq("id", selectedNote.id)
        .select("id, title, content_jsonb, properties_jsonb, collection_id")
        .single();

      if (!error && data) {
        setNotes((prev) =>
          prev.map((note) => (note.id === data.id ? (data as DbNote) : note)),
        );
      }

      setIsSaving(false);
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, contentText, properties, selectedNote]);

  /**
   * Creates a new property definition for the selected note.
   */
  const handleCreateProperty = () => {
    if (!selectedId) {
      return;
    }

    const trimmedLabel = newPropertyLabel.trim();
    if (!trimmedLabel) {
      return;
    }

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `prop-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const nextProperty: Property = {
      id,
      page_id: selectedId,
      label: trimmedLabel,
      value_type: newPropertyType,
      value: "",
    };

    setProperties((prev) => [nextProperty, ...prev]);
    setNewPropertyLabel("");
    setNewPropertyType("text");
  };

  /**
   * Updates local property state and lets autosave persist it.
   */
  const handlePropertyValueChange = (propertyId: string, value: string) => {
    setProperties((prev) =>
      prev.map((property) =>
        property.id === propertyId ? { ...property, value } : property,
      ),
    );
  };

  /**
   * Creates a new note and focuses it for editing.
   */
  const handleCreateNote = async () => {
    setIsSaving(true);
    try {
      const newNote = await createNote(null);
      setNotes((prev) => [newNote, ...prev]);
      setSelectedId(newNote.id);
      applyNoteToEditor(newNote);
      setProperties(normalizeProperties(newNote.properties_jsonb));
      setStatusMessage("");
    } catch (error) {
      setStatusMessage("No se pudo crear la nota.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotesLoaded = useCallback(
    (loadedNotes: DbNote[]) => {
      setNotes(loadedNotes);

      if (loadedNotes.length === 0) {
        setSelectedId(null);
        applyNoteToEditor(null);
        return;
      }

      const nextSelected =
        (selectedId
          ? loadedNotes.find((note) => note.id === selectedId)
          : null) ?? loadedNotes[0];

      setSelectedId(nextSelected.id);
      applyNoteToEditor(nextSelected);
    },
    [selectedId],
  );

  return (
    <div className="flex min-h-screen bg-white text-zinc-900">
      <Sidebar
        notes={notes}
        collections={collections}
        selectedNoteId={selectedId}
        statusMessage={statusMessage}
        onSelectNote={handleSelectNote}
        onNotesLoaded={handleNotesLoaded}
        onCollectionsLoaded={setCollections}
        onStatusMessageChange={setStatusMessage}
      />
      <main className="flex flex-1 flex-col px-10 py-12">
        <NoteEditor
          note={selectedNote}
          title={title}
          contentText={contentText}
          isSaving={isSaving}
          properties={properties}
          newPropertyLabel={newPropertyLabel}
          newPropertyType={newPropertyType}
          statusMessage={statusMessage}
          onTitleChange={setTitle}
          onContentChange={setContentText}
          onNewPropertyLabelChange={setNewPropertyLabel}
          onNewPropertyTypeChange={setNewPropertyType}
          onCreateProperty={handleCreateProperty}
          onPropertyValueChange={handlePropertyValueChange}
          onCreateNote={handleCreateNote}
        />
      </main>
    </div>
  );
}

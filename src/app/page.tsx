"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import NoteEditor from "@/components/NoteEditor";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import type { Note, NoteContent, Property, PropertyType } from "@/types";

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

  useEffect(() => {
    return () => {
      Object.values(propertyTimeoutsRef.current).forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      propertyTimeoutsRef.current = {};
    };
  }, [selectedId]);

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
      <Sidebar
        notes={notes}
        selectedId={selectedId}
        statusMessage={statusMessage}
        onSelectNote={setSelectedId}
        onCreateNote={handleCreateNote}
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

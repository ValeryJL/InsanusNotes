import { supabase } from "@/lib/supabase";
import type { Collection, Note } from "@/types/database";

const COLLECTION_FIELDS =
  "id, user_id, name, icon, description, schema_json, created_at";
const NOTE_FIELDS =
  "id, user_id, collection_id, parent_id, title, content_jsonb, properties_jsonb, is_archived, created_at";

export const getCollections = async (): Promise<Collection[]> => {
  const { data, error } = await supabase
    .from("collections")
    .select(COLLECTION_FIELDS)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Collection[];
};

export const getNotes = async (collectionId: string | null): Promise<Note[]> => {
  const query = supabase.from("notes").select(NOTE_FIELDS).order("created_at", {
    ascending: true,
  });

  const { data, error } = collectionId
    ? await query.eq("collection_id", collectionId)
    : await query.is("collection_id", null);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Note[];
};

export const createCollection = async (name: string): Promise<Collection> => {
  const { data, error } = await supabase
    .from("collections")
    .insert({ name, schema_json: [] })
    .select(COLLECTION_FIELDS)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create collection");
  }

  return data as Collection;
};

export const createNote = async (collectionId: string | null): Promise<Note> => {
  const { data, error } = await supabase
    .from("notes")
    .insert({
      title: "Sin titulo",
      collection_id: collectionId,
      content_jsonb: { text: "" },
      properties_jsonb: [],
    })
    .select(NOTE_FIELDS)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create note");
  }

  return data as Note;
};

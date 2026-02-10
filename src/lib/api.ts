import { supabase } from "@/lib/supabase";
import type { Collection, Note } from "@/types/database";

const COLLECTION_FIELDS =
  "id, user_id, name, icon, description, schema_json, created_at";
const NOTE_FIELDS =
  "id, user_id, collection_id, parent_id, title, icon, content_jsonb, properties_jsonb, is_archived, created_at";

const DEFAULT_USER_ID = process.env.NEXT_PUBLIC_SUPABASE_USER_ID;

const getDefaultUserId = () => {
  if (!DEFAULT_USER_ID) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_USER_ID");
  }

  return DEFAULT_USER_ID;
};

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

export const getCollectionById = async (
  collectionId: string,
): Promise<Collection> => {
  const { data, error } = await supabase
    .from("collections")
    .select(COLLECTION_FIELDS)
    .eq("id", collectionId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Collection not found");
  }

  return data as Collection;
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
    .insert({ name, schema_json: [], user_id: getDefaultUserId() })
    .select(COLLECTION_FIELDS)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create collection");
  }

  return data as Collection;
};

export const updateCollectionSchema = async (
  collectionId: string,
  schema: Collection["schema_json"],
): Promise<Collection> => {
  const { data, error } = await supabase
    .from("collections")
    .update({ schema_json: schema })
    .eq("id", collectionId)
    .select(COLLECTION_FIELDS)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update schema");
  }

  return data as Collection;
};

export const createNote = async (collectionId: string | null): Promise<Note> => {
  const properties = collectionId ? {} : [];
  const { data, error } = await supabase
    .from("notes")
    .insert({
      title: "Sin titulo",
      collection_id: collectionId,
      user_id: getDefaultUserId(),
      content_jsonb: { text: "" },
      properties_jsonb: properties,
    })
    .select(NOTE_FIELDS)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create note");
  }

  return data as Note;
};

export const deleteNote = async (noteId: string): Promise<void> => {
  const { error } = await supabase.from("notes").delete().eq("id", noteId);

  if (error) {
    throw new Error(error.message);
  }
};

export const getBacklinks = async (noteId: string): Promise<Note[]> => {
  const { data, error } = await supabase
    .from("notes")
    .select("id, title, icon, collection_id")
    .or(
      `content_jsonb::text.ilike.%${noteId}%,properties_jsonb::text.ilike.%${noteId}%`,
    )
    .neq("id", noteId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Note[];
};

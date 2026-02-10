export type PropertyDefinition = {
  id: string;
  name: string;
  type: "text" | "number" | "date" | "bool" | "select" | "relation";
  options?: string[];
  relation_collection_id?: string | null;
};

export type Collection = {
  id: string;
  user_id?: string | null;
  name: string;
  icon?: string | null;
  description?: string | null;
  schema_json: PropertyDefinition[];
  created_at?: string;
};

export type Note = {
  id: string;
  user_id?: string | null;
  collection_id: string | null;
  parent_id?: string | null;
  title: string | null;
  icon?: string | null;
  content_jsonb?: Record<string, unknown> | null;
  properties_jsonb: Record<string, unknown> | unknown[] | null;
  is_archived?: boolean | null;
  created_at?: string;
};

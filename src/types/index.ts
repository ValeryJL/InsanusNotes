export type NoteContent = {
  text?: string;
  blocks?: ContentBlock[];
  [key: string]: unknown;
};

export type ContentBlockType =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "collection_view";

export type ContentBlock = {
  id: string;
  type: ContentBlockType;
  text?: string;
  collectionId?: string;
};

export type Note = {
  id: string;
  title: string;
  content: NoteContent | null;
};

export type PropertyType = "text" | "number" | "date" | "status" | "relation";

export type Property = {
  id: string;
  page_id: string | null;
  label: string;
  value_type: PropertyType | null;
  value: string | null;
};

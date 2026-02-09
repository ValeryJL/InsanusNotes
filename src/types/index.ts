export type NoteContent = {
  text?: string;
  [key: string]: unknown;
};

export type Note = {
  id: string;
  title: string;
  content: NoteContent | null;
};

export type PropertyType = "text" | "number" | "date" | "status";

export type Property = {
  id: string;
  page_id: string | null;
  label: string;
  value_type: PropertyType | null;
  value: string | null;
};

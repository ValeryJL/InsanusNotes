import { Note } from "@/types";

type SidebarProps = {
  notes: Note[];
  selectedId: string | null;
  statusMessage: string;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
};

export default function Sidebar({
  notes,
  selectedId,
  statusMessage,
  onSelectNote,
  onCreateNote,
}: SidebarProps) {
  return (
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
          onClick={onCreateNote}
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
                  onClick={() => onSelectNote(note.id)}
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
  );
}

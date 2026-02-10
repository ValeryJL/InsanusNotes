import { useEffect, useMemo, useState } from "react";
import type { Collection } from "@/types/database";
import type { ContentBlockType } from "@/types";

type CommandMenuProps = {
  isOpen: boolean;
  collections: Collection[];
  position?: { x: number; y: number } | null;
  onSelect: (type: ContentBlockType, collectionId?: string) => void;
  onClose: () => void;
};

const menuItemClass =
  "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100";

export default function CommandMenu({
  isOpen,
  collections,
  position,
  onSelect,
  onClose,
}: CommandMenuProps) {
  const [mode, setMode] = useState<"root" | "collections">("root");

  const availableCollections = useMemo(() => collections, [collections]);

  useEffect(() => {
    if (!isOpen) {
      setMode("root");
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const style = position
    ? { left: position.x, top: position.y }
    : { left: 0, top: 96 };

  return (
    <div
      className="absolute z-20 w-72 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg"
      style={style}
    >
      {mode === "root" ? (
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              onSelect("paragraph");
              onClose();
            }}
            className={menuItemClass}
          >
            <span>/texto</span>
            <span className="text-xs text-zinc-400">Parrafo</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onSelect("heading1");
              onClose();
            }}
            className={menuItemClass}
          >
            <span>/h1</span>
            <span className="text-xs text-zinc-400">Encabezado</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onSelect("heading2");
              onClose();
            }}
            className={menuItemClass}
          >
            <span>/h2</span>
            <span className="text-xs text-zinc-400">Subtitulo</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("collections")}
            className={menuItemClass}
          >
            <span>/tabla</span>
            <span className="text-xs text-zinc-400">Vista de coleccion</span>
          </button>
        </div>
      ) : (
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setMode("root")}
            className="mb-2 text-xs text-zinc-400"
          >
            Volver
          </button>
          {availableCollections.length === 0 ? (
            <p className="px-3 py-2 text-xs text-zinc-400">
              Sin colecciones.
            </p>
          ) : (
            availableCollections.map((collection) => (
              <button
                key={collection.id}
                type="button"
                onClick={() => {
                  onSelect("collection_view", collection.id);
                  onClose();
                }}
                className={menuItemClass}
              >
                <span>{collection.name}</span>
                <span className="text-xs text-zinc-400">{collection.id}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

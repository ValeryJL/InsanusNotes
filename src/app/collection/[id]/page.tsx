"use client";

import { useParams } from "next/navigation";
import TableView from "@/components/TableView";

export default function CollectionPage() {
  const params = useParams<{ id: string }>();
  const collectionId = params?.id;

  if (!collectionId) {
    return (
      <div className="p-10 text-sm text-zinc-500">
        Coleccion no encontrada.
      </div>
    );
  }

  return <TableView collectionId={collectionId} />;
}

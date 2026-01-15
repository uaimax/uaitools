/** Inbox - Notas não classificadas. */

import { useNotes } from "../hooks/use-notes";
import { InboxNoteCard } from "../components/InboxNoteCard";
import { Loader2, Inbox as InboxIcon } from "lucide-react";
import { useBauMentalStore } from "../stores/bau-mental-store";

export function InboxViewPage() {
  const { searchQuery } = useBauMentalStore();
  const { data: notes, isLoading } = useNotes({
    inbox: true,
    search: searchQuery || undefined,
  });
  const notesArray = Array.isArray(notes) ? notes : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <InboxIcon className="w-6 h-6" />
          Inbox
        </h1>
        <p className="text-muted-foreground">
          {notesArray.length} {notesArray.length === 1 ? "nota" : "notas"} para classificar
        </p>
      </div>

      {notesArray.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <InboxIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-semibold">Tudo organizado!</p>
            <p className="text-muted-foreground">
              Suas notas estão nas caixinhas.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto space-y-4">
          {notesArray.map((note) => (
            <InboxNoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}

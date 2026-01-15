/** Timeline de notas ordenável com virtualização. */

import { useMemo } from "react";
import { NoteCard } from "./NoteCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Inbox, FileText } from "lucide-react";
import type { Note } from "../hooks/use-notes";

interface NotesTimelineProps {
  notes: Note[];
  boxId?: string;
}

export function NotesTimeline({ notes, boxId }: NotesTimelineProps) {
  // Agrupar por data (memoizado para performance)
  const groupedByDate = useMemo(() => {
    if (notes.length === 0) return {};

    return notes.reduce((acc, note) => {
      const date = new Date(note.created_at).toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(note);
      return acc;
    }, {} as Record<string, Note[]>);
  }, [notes]);

  if (notes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-semibold">Nenhuma nota ainda</p>
            <p className="text-sm text-muted-foreground mt-2">
              Suas notas aparecerão aqui quando você gravar ou enviar arquivos
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-8">
        {Object.entries(groupedByDate).map(([date, dateNotes]) => (
          <div key={date}>
            <h2 className="text-sm font-semibold text-muted-foreground mb-4 sticky top-0 bg-background/80 backdrop-blur z-10 py-2">
              {date}
            </h2>
            <div className="space-y-4">
              {dateNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

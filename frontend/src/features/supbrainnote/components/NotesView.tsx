/** Visualização de anotações - Modal ou drawer. */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NoteList } from "./NoteList";
import { NoteDetail } from "./NoteDetail";
import { useNotes } from "../hooks/use-notes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles } from "lucide-react";

interface NotesViewProps {
  boxId: string | null;
  boxName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSummarize?: () => void;
}

export function NotesView({ boxId, boxName, open, onOpenChange, onSummarize }: NotesViewProps) {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const { data: notes } = useNotes({
    box: boxId || undefined,
    inbox: boxId === null,
  });
  const notesArray = Array.isArray(notes) ? notes : [];
  const notesCount = notesArray.length;

  const handleNoteClick = (noteId: string) => {
    setSelectedNoteId(noteId);
  };

  const handleBackFromNote = () => {
    setSelectedNoteId(null);
  };

  return (
    <>
      <Dialog open={open && !selectedNoteId} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{boxName || "Inbox"}</DialogTitle>
                {notesCount > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {notesCount} {notesCount === 1 ? "nota" : "notas"}
                  </p>
                )}
              </div>
              {onSummarize && boxId && notesCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSummarize}
                  className="gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Resumir com IA
                </Button>
              )}
            </div>
          </DialogHeader>
          {open && (
            <NoteList
              boxId={boxId}
              onNoteClick={handleNoteClick}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Tela de Nota Individual */}
      <NoteDetail
        noteId={selectedNoteId}
        open={!!selectedNoteId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedNoteId(null);
          }
        }}
        onBack={handleBackFromNote}
      />
    </>
  );
}


/** Visão global - Todas as notas. */

import { useNotes } from "../hooks/use-notes";
import { NotesTimeline } from "../components/NotesTimeline";
import { Loader2, MessageSquare } from "lucide-react";
import { useBauMentalStore } from "../stores/bau-mental-store";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function GlobalViewPage() {
  const navigate = useNavigate();
  const { searchQuery } = useBauMentalStore();
  const { data: notes, isLoading } = useNotes({
    search: searchQuery || undefined,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Todas as Notas</h1>
          <p className="text-muted-foreground">
            {Array.isArray(notes) ? notes.length : 0} notas
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/bau-mental/thread")}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Conversar
        </Button>
      </div>
      <div className="flex-1 overflow-auto">
        <NotesTimeline notes={notes || []} />
      </div>
    </div>
  );
}

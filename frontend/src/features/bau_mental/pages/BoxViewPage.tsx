/** Visão de caixinha - Timeline de notas. */

import { useParams, useNavigate } from "react-router-dom";
import { useBox } from "../hooks/use-boxes";
import { useNotes } from "../hooks/use-notes";
import { BoxHeader } from "../components/BoxHeader";
import { NotesTimeline } from "../components/NotesTimeline";
import { Loader2 } from "lucide-react";
import { useBauMentalStore } from "../stores/bau-mental-store";

export function BoxViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { searchQuery } = useBauMentalStore();
  const { data: box, isLoading: boxLoading } = useBox(id || null);
  const { data: notes, isLoading: notesLoading } = useNotes({
    box: id || undefined,
    search: searchQuery || undefined,
  });

  if (boxLoading || notesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!box) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground">Caixinha não encontrada</p>
          <button
            onClick={() => navigate("/bau-mental/global")}
            className="text-primary hover:underline mt-2"
          >
            Voltar para Global
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <BoxHeader box={box} />
      <div className="flex-1 overflow-auto">
        <NotesTimeline notes={notes || []} boxId={box.id} />
      </div>
    </div>
  );
}

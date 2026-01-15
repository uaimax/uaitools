/** Página de nota individual. */

import { useParams, useNavigate } from "react-router-dom";
import { useNote } from "../hooks/use-notes";
import { NoteDetailHeader } from "../components/NoteDetailHeader";
import { NoteTranscript } from "../components/NoteTranscript";
import { NoteMetadata } from "../components/NoteMetadata";
import { Loader2 } from "lucide-react";

export function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: note, isLoading } = useNote(id || null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground">Nota não encontrada</p>
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
    <div className="h-full flex flex-col p-6">
      <NoteDetailHeader note={note} />
      <div className="flex-1 overflow-auto mt-6 space-y-6">
        <NoteTranscript note={note} />
        <NoteMetadata note={note} />
      </div>
    </div>
  );
}

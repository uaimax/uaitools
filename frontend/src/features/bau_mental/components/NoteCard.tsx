/** Card de nota refatorado para timeline. */

import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Clock } from "lucide-react";
import type { Note } from "../hooks/use-notes";
// Formatação de data nativa

interface NoteCardProps {
  note: Note;
}

export function NoteCard({ note }: NoteCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/bau-mental/note/${note.id}`);
  };

  // Limpar prefixos estranhos e melhorar preview
  const cleanTranscript = note.transcript
    ? note.transcript
        .replace(/^""txt\s*/i, "") // Remove prefixo ""txt
        .replace(/^\s+|\s+$/g, "") // Remove espaços no início/fim
        .trim()
    : "";

  const preview = cleanTranscript
    ? cleanTranscript.substring(0, 150) + (cleanTranscript.length > 150 ? "..." : "")
    : "Sem transcrição ainda";

  const timeAgo = note.created_at
    ? new Date(note.created_at).toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {note.box_name && (
                <Badge variant="outline" className="text-xs">
                  {note.box_name}
                </Badge>
              )}
              {!note.box_name && (
                <Badge variant="secondary" className="text-xs">
                  Inbox
                </Badge>
              )}
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgo}
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {preview}
            </p>
            {note.duration_seconds && (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Play className="w-3 h-3" />
                {Math.round(note.duration_seconds)}s
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

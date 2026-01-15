/** Card especial para notas no Inbox com sugestões de caixinha. */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Clock, Check } from "lucide-react";
import { useBoxes } from "../hooks/use-boxes";
import { useMoveNote } from "../hooks/use-notes";
import { toast } from "@/hooks/use-toast";
import type { Note } from "../hooks/use-notes";
// Formatação de data nativa

interface InboxNoteCardProps {
  note: Note;
}

export function InboxNoteCard({ note }: InboxNoteCardProps) {
  const { data: boxes } = useBoxes();
  const moveMutation = useMoveNote();
  const boxesArray = Array.isArray(boxes) ? boxes : [];

  const handleMoveToBox = async (boxId: string) => {
    try {
      await moveMutation.mutateAsync({ id: note.id, box_id: boxId });
      toast({
        title: "Sucesso",
        description: "Nota movida com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível mover a nota.",
        variant: "destructive",
      });
    }
  };

  const preview = note.transcript
    ? note.transcript.substring(0, 200) + (note.transcript.length > 200 ? "..." : "")
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
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Badge variant="secondary">INBOX</Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </span>
          </div>

          {/* Preview */}
          <p className="text-sm text-muted-foreground">{preview}</p>

          {/* Audio info */}
          {note.duration_seconds && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Play className="w-3 h-3" />
              {Math.round(note.duration_seconds)}s
            </div>
          )}

          {/* Divider */}
          <div className="border-t" />

          {/* Sugestões de caixinha */}
          <div>
            <p className="text-xs font-semibold mb-2">Mover para:</p>
            <div className="flex flex-wrap gap-2">
              {boxesArray.slice(0, 4).map((box) => (
                <Button
                  key={box.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleMoveToBox(box.id)}
                  disabled={moveMutation.isPending}
                >
                  {box.name}
                </Button>
              ))}
              {boxesArray.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Crie uma caixinha primeiro
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

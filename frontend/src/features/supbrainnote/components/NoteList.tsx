/** Componente para listar anotações. */

import { useNotes } from "../hooks/use-notes";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Play, Trash2, Move } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMoveNote, useDeleteNote } from "../hooks/use-notes";
import { useBoxes } from "../hooks/use-boxes";
import { toast } from "@/hooks/use-toast";
// Removido date-fns - usando formatação simples

interface NoteListProps {
  boxId?: string | null;
  onMoveNote?: (noteId: string) => void;
}

export function NoteList({ boxId, onMoveNote }: NoteListProps) {
  const { data: notes, isLoading } = useNotes({
    box: boxId || undefined,
    inbox: boxId === null,
  });
  const { data: boxes } = useBoxes();
  const moveMutation = useMoveNote();
  const deleteMutation = useDeleteNote();

  const handleMove = async (noteId: string, targetBoxId: string | null) => {
    try {
      await moveMutation.mutateAsync({ id: noteId, box_id: targetBoxId });
      toast({
        title: "Sucesso",
        description: "Anotação movida com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível mover a anotação.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm("Tem certeza que deseja deletar esta anotação?")) return;

    try {
      await deleteMutation.mutateAsync(noteId);
      toast({
        title: "Sucesso",
        description: "Anotação deletada com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível deletar a anotação.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (!notes || notes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhuma anotação encontrada.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <Card key={note.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant={
                      note.processing_status === "completed"
                        ? "default"
                        : note.processing_status === "processing"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {note.processing_status_display}
                  </Badge>
                  {note.box_name && (
                    <Badge variant="outline">{note.box_name}</Badge>
                  )}
                  {note.ai_confidence !== undefined && (
                    <Badge variant="outline">
                      {Math.round(note.ai_confidence * 100)}% confiança
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(note.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {note.audio_url && (
                    <DropdownMenuItem
                      onClick={() => window.open(note.audio_url, "_blank")}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Ouvir áudio
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => onMoveNote?.(note.id)}
                  >
                    <Move className="w-4 h-4 mr-2" />
                    Mover
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(note.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Deletar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            {note.transcript ? (
              <p className="text-sm whitespace-pre-wrap">{note.transcript}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {note.processing_status === "pending"
                  ? "Aguardando processamento..."
                  : note.processing_status === "processing"
                  ? "Processando áudio..."
                  : "Transcrição não disponível"}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


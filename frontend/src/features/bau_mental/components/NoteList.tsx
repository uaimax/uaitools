/** Componente para listar anotações. */

import { useState } from "react";
import { useNotes } from "../hooks/use-notes";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Play, Trash2, Move } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMoveNote, useDeleteNote } from "../hooks/use-notes";
import { toast } from "@/hooks/use-toast";
import { MoveNoteModal } from "./MoveNoteModal";
import { DeleteNoteModal } from "./DeleteNoteModal";
// Removido date-fns - usando formatação simples

interface NoteListProps {
  boxId?: string | null;
  onMoveNote?: (noteId: string) => void;
  onNoteClick?: (noteId: string) => void;
}

export function NoteList({ boxId, onMoveNote, onNoteClick }: NoteListProps) {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/8a2091d5-0f0b-4303-b859-a6756e62cd84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NoteList.tsx:23',message:'NoteList render iniciado',data:{boxId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  // Se boxId é null, estamos vendo o inbox
  const isInbox = boxId === null || boxId === undefined;
  const [moveNoteId, setMoveNoteId] = useState<string | null>(null);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);

  console.log("NoteList renderizado:", { boxId, isInbox });

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/8a2091d5-0f0b-4303-b859-a6756e62cd84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NoteList.tsx:29',message:'Antes de chamar useNotes',data:{isInbox,boxId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  const { data: notes, isLoading, error: notesError } = useNotes({
    box: isInbox ? undefined : boxId,
    inbox: isInbox,
  });

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/8a2091d5-0f0b-4303-b859-a6756e62cd84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NoteList.tsx:34',message:'useNotes retornou',data:{notesIsArray:Array.isArray(notes),notesLength:notes?.length||0,isLoading,hasError:!!notesError,errorMessage:notesError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  console.log("NoteList - dados:", {
    notesLength: notes?.length || 0,
    isLoading,
    error: notesError?.message,
    boxId,
    isInbox
  });

  const moveMutation = useMoveNote();
  const deleteMutation = useDeleteNote();

  // Se houver erro, mostrar mensagem mas não quebrar
  if (notesError) {
    console.error("Erro ao carregar anotações:", notesError);
  }

  // Garantir que notes é sempre um array
  const safeNotes = Array.isArray(notes) ? notes : [];

  const handleMove = async (noteId: string, targetBoxId: string | null) => {
    try {
      await moveMutation.mutateAsync({ id: noteId, box_id: targetBoxId });
      toast({
        title: "Sucesso",
        description: "Anotação movida com sucesso!",
      });
      setMoveNoteId(null);
      onMoveNote?.(noteId);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível mover a anotação.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      await deleteMutation.mutateAsync(noteId);
      toast({
        title: "Sucesso",
        description: "Anotação deletada com sucesso!",
      });
      setDeleteNoteId(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível deletar a anotação.",
        variant: "destructive",
      });
    }
  };

  const noteToMove = moveNoteId ? safeNotes.find((n) => n.id === moveNoteId) : null;
  const noteToDelete = deleteNoteId ? safeNotes.find((n) => n.id === deleteNoteId) : null;

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (notesError) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            Erro ao carregar anotações. Tente recarregar a página.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (safeNotes.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhuma anotação encontrada.
      </div>
    );
  }

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/8a2091d5-0f0b-4303-b859-a6756e62cd84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NoteList.tsx:107',message:'Antes de renderizar lista de notas',data:{safeNotesLength:safeNotes.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  return (
    <div className="space-y-4">
      {safeNotes.map((note) => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/8a2091d5-0f0b-4303-b859-a6756e62cd84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NoteList.tsx:110',message:'Renderizando nota',data:{noteId:note?.id,hasNote:!!note},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        return (
          <Card
            key={note.id}
            className={onNoteClick ? "cursor-pointer hover:bg-accent/50 transition-colors" : undefined}
            onClick={() => onNoteClick?.(note.id)}
          >
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setMoveNoteId(note.id);
                    }}
                  >
                    <Move className="w-4 h-4 mr-2" />
                    Mover
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteNoteId(note.id);
                    }}
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
        );
      })}

      {/* Modal: Mover Nota */}
      {noteToMove && (
        <MoveNoteModal
          open={!!moveNoteId}
          onOpenChange={(open) => {
            if (!open) setMoveNoteId(null);
          }}
          onMove={(targetBoxId) => handleMove(noteToMove.id, targetBoxId)}
          currentBoxId={noteToMove.box || null}
        />
      )}

      {/* Modal: Confirmar Exclusão */}
      {noteToDelete && (
        <DeleteNoteModal
          open={!!deleteNoteId}
          onOpenChange={(open) => {
            if (!open) setDeleteNoteId(null);
          }}
          onConfirm={() => handleDelete(noteToDelete.id)}
          noteTitle={noteToDelete.transcript?.substring(0, 50) || "esta nota"}
        />
      )}
    </div>
  );
}


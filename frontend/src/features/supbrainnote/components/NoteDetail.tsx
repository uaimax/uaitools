/** Visualização completa de uma nota individual. */

import { useNote } from "../hooks/use-notes";
import { useBoxes } from "../hooks/use-boxes";
import { useMoveNote, useDeleteNote } from "../hooks/use-notes";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Mic,
  Download,
  Move,
  Trash2,
  MoreVertical,
  ArrowLeft
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { AudioPlayer } from "./AudioPlayer";
import { useState } from "react";
import { MoveNoteModal } from "./MoveNoteModal";
import { DeleteNoteModal } from "./DeleteNoteModal";

interface NoteDetailProps {
  noteId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBack?: () => void;
}

export function NoteDetail({ noteId, open, onOpenChange, onBack }: NoteDetailProps) {
  const { data: note, isLoading, error } = useNote(noteId);
  const { data: boxes } = useBoxes();
  const moveMutation = useMoveNote();
  const deleteMutation = useDeleteNote();
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const boxesArray = Array.isArray(boxes) ? boxes : [];
  const noteBox = note?.box ? boxesArray.find((b) => b.id === note.box) : null;

  const handleMove = async (targetBoxId: string | null) => {
    if (!noteId) return;

    try {
      await moveMutation.mutateAsync({ id: noteId, box_id: targetBoxId });
      toast({
        title: "Sucesso",
        description: `Nota movida para ${targetBoxId ? noteBox?.name || "caixinha" : "Inbox"}`,
      });
      setShowMoveModal(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível mover a nota.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!noteId) return;

    try {
      await deleteMutation.mutateAsync(noteId);
      toast({
        title: "Sucesso",
        description: "Nota deletada com sucesso!",
      });
      setShowDeleteModal(false);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível deletar a nota.",
        variant: "destructive",
      });
    }
  };

  if (!open || !noteId) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {onBack && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    className="mr-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                )}
                <DialogTitle>Nota</DialogTitle>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowMoveModal(true)}>
                    <Move className="w-4 h-4 mr-2" />
                    Mover para outra caixinha
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowDeleteModal(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Deletar nota
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </DialogHeader>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-64" />
            </div>
          ) : error ? (
            <Card className="border-destructive">
              <CardContent className="p-6">
                <div className="text-center text-destructive">
                  Erro ao carregar nota. Tente novamente.
                </div>
              </CardContent>
            </Card>
          ) : note ? (
            <div className="space-y-6">
              {/* Badge da Caixinha */}
              {noteBox && (
                <div>
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    {noteBox.name}
                  </Badge>
                </div>
              )}

              {/* Metadados */}
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  {note.source_type === "memo" ? (
                    <Mic className="w-4 h-4" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>
                    {note.source_type === "memo" ? "Sua nota" : "Áudio de grupo"}
                  </span>
                </div>
                <span>•</span>
                <span>
                  {new Date(note.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {/* Player de Áudio */}
              {note.audio_url && (
                <div className="space-y-2">
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <AudioPlayer audioUrl={note.audio_url} />
                  </div>
                  {/* Aviso de retenção de 7 dias */}
                  {note.days_until_expiration !== undefined && note.days_until_expiration <= 7 && (
                    <div className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-3">
                      <span className="font-medium">⚠️ Retenção de áudio:</span>{" "}
                      {note.days_until_expiration === 0
                        ? "Este áudio será removido hoje"
                        : note.days_until_expiration === 1
                        ? "Este áudio será removido amanhã"
                        : `Este áudio será removido em ${note.days_until_expiration} dias`}
                      . Os áudios são mantidos por 7 dias para otimizar o armazenamento.
                    </div>
                  )}
                </div>
              )}

              {/* Transcrição */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Transcrição</h3>
                {note.transcript ? (
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {note.transcript}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground italic">
                        {note.processing_status === "pending"
                          ? "Aguardando processamento..."
                          : note.processing_status === "processing"
                          ? "Processando áudio..."
                          : "Transcrição não disponível"}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Metadados Adicionais */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {note.duration_seconds && (
                  <div>
                    <span className="text-muted-foreground">Duração: </span>
                    <span>{Math.round(note.duration_seconds)}s</span>
                  </div>
                )}
                {note.file_size_bytes && (
                  <div>
                    <span className="text-muted-foreground">Tamanho: </span>
                    <span>{(note.file_size_bytes / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                )}
                {note.ai_confidence !== undefined && (
                  <div>
                    <span className="text-muted-foreground">Confiança da IA: </span>
                    <span>{Math.round(note.ai_confidence * 100)}%</span>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Modal: Mover Nota */}
      <MoveNoteModal
        open={showMoveModal}
        onOpenChange={setShowMoveModal}
        onMove={handleMove}
        currentBoxId={note?.box || null}
      />

      {/* Modal: Confirmar Exclusão */}
      <DeleteNoteModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleDelete}
        noteTitle={note?.transcript?.substring(0, 50) || "esta nota"}
      />
    </>
  );
}



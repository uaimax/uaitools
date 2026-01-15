/** Ações para notas: mover, mesclar, marcar importante, excluir, duplicar. */

import {
  Move,
  Merge,
  Star,
  Trash2,
  Copy,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useMoveNote, useDeleteNote } from "../hooks/use-notes";
import { useBoxes } from "../hooks/use-boxes";
import { toast } from "@/hooks/use-toast";
import { MoveNoteModal } from "./MoveNoteModal";
import { DeleteNoteModal } from "./DeleteNoteModal";
import type { Note } from "../hooks/use-notes";
import { useState } from "react";

interface NoteActionsProps {
  note: Note;
  onMove?: () => void;
  onDelete?: () => void;
}

export function NoteActions({ note, onMove, onDelete }: NoteActionsProps) {
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const moveMutation = useMoveNote();
  const deleteMutation = useDeleteNote();
  const { data: boxes } = useBoxes();

  const handleMove = async (boxId: string | null) => {
    try {
      await moveMutation.mutateAsync({ id: note.id, box_id: boxId });
      toast({
        title: "Sucesso",
        description: "Nota movida com sucesso!",
      });
      setShowMoveModal(false);
      onMove?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível mover a nota",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(note.id);
      toast({
        title: "Sucesso",
        description: "Nota excluída com sucesso!",
      });
      setShowDeleteModal(false);
      onDelete?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a nota",
        variant: "destructive",
      });
    }
  };

  const handleDuplicate = async () => {
    // TODO: Implementar duplicação
    toast({
      title: "Em breve",
      description: "Funcionalidade de duplicação será implementada em breve",
    });
  };

  const handleMarkImportant = async () => {
    // TODO: Implementar marcação de importante (requer campo no modelo)
    toast({
      title: "Em breve",
      description: "Funcionalidade de marcação será implementada em breve",
    });
  };

  const handleMerge = async () => {
    // TODO: Implementar mesclagem
    toast({
      title: "Em breve",
      description: "Funcionalidade de mesclagem será implementada em breve",
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowMoveModal(true)}>
            <Move className="w-4 h-4 mr-2" />
            Mover para caixinha
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleMarkImportant}>
            <Star className="w-4 h-4 mr-2" />
            Marcar como importante
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDuplicate}>
            <Copy className="w-4 h-4 mr-2" />
            Duplicar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleMerge}>
            <Merge className="w-4 h-4 mr-2" />
            Mesclar com outra nota
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteModal(true)}
            className="text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showMoveModal && (
        <MoveNoteModal
          open={showMoveModal}
          onOpenChange={setShowMoveModal}
          note={note}
          onMove={handleMove}
        />
      )}

      {showDeleteModal && (
        <DeleteNoteModal
          open={showDeleteModal}
          onOpenChange={setShowDeleteModal}
          note={note}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}

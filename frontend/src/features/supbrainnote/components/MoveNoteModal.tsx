/** Modal para mover nota entre caixinhas. */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBoxes } from "../hooks/use-boxes";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface MoveNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMove: (boxId: string | null) => void;
  currentBoxId?: string | null;
  onCreateBox?: () => void;
}

export function MoveNoteModal({
  open,
  onOpenChange,
  onMove,
  currentBoxId,
  onCreateBox,
}: MoveNoteModalProps) {
  const { data: boxes, isLoading } = useBoxes();
  const boxesArray = Array.isArray(boxes) ? boxes : [];
  const [selectedBoxId, setSelectedBoxId] = useState<string | null | undefined>(currentBoxId);

  const handleConfirm = () => {
    if (selectedBoxId !== undefined) {
      onMove(selectedBoxId);
    }
  };

  const handleSelect = (boxId: string | null) => {
    setSelectedBoxId(boxId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mover para qual caixinha?</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {/* Opção Inbox */}
              <Card
                className={cn(
                  "cursor-pointer transition-all",
                  selectedBoxId === null
                    ? "bg-accent/30 border-primary/30"
                    : "hover:bg-accent/50"
                )}
                onClick={() => handleSelect(null)}
              >
                <CardContent className="p-4">
                  <div className="font-medium">Inbox</div>
                  <div className="text-sm text-muted-foreground">
                    Não classificado
                  </div>
                </CardContent>
              </Card>

              {/* Caixinhas */}
              {boxesArray.map((box) => (
                <Card
                  key={box.id}
                  className={cn(
                    "cursor-pointer transition-all",
                    selectedBoxId === box.id
                      ? "bg-accent/30 border-primary/30"
                      : "hover:bg-accent/50"
                  )}
                  onClick={() => handleSelect(box.id)}
                  style={box.color ? { borderColor: box.color } : undefined}
                >
                  <CardContent className="p-4">
                    <div className="font-medium">{box.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {box.notes_count || 0} {box.notes_count === 1 ? "nota" : "notas"}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Botão criar nova */}
              {onCreateBox && (
                <Card
                  className="cursor-pointer hover:bg-accent/50 border-dashed border-2"
                  onClick={onCreateBox}
                >
                  <CardContent className="p-4 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Criar nova caixinha
                    </span>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedBoxId === undefined || selectedBoxId === currentBoxId}
            >
              Mover
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


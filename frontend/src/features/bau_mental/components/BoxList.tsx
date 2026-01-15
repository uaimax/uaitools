/** Componente para listar caixinhas. */

import { useBoxes } from "../hooks/use-boxes";
import { useNotes } from "../hooks/use-notes";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BoxListProps {
  onSelectBox?: (boxId: string | null) => void;
  selectedBoxId?: string | null;
  onCreateBox?: () => void;
}

export function BoxList({ onSelectBox, selectedBoxId, onCreateBox }: BoxListProps) {
  const { data: boxes, isLoading, error: boxesError } = useBoxes();
  const { data: inboxNotes } = useNotes({ inbox: true });

  // Garantir que são arrays
  const boxesArray = Array.isArray(boxes) ? boxes : [];
  const inboxNotesArray = Array.isArray(inboxNotes) ? inboxNotes : [];

  // Se houver erro, mostrar mensagem mas não quebrar
  if (boxesError) {
    console.error("Erro ao carregar caixinhas:", boxesError);
  }

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-32 flex-shrink-0" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {/* Inbox */}
      <Card
        className={`flex-shrink-0 cursor-pointer transition-all ${
          selectedBoxId === null
            ? "ring-2 ring-primary"
            : "hover:bg-accent"
        }`}
        onClick={() => onSelectBox?.(null)}
      >
        <CardContent className="p-4 min-w-[120px]">
          <div className="text-sm font-medium">Inbox</div>
          <div className="text-xs text-muted-foreground mt-1">
            {inboxNotesArray.length} anotações
          </div>
        </CardContent>
      </Card>

      {/* Caixinhas */}
      {boxesArray.map((box) => (
        <Card
          key={box.id}
          className={`flex-shrink-0 cursor-pointer transition-all ${
            selectedBoxId === box.id
              ? "ring-2 ring-primary"
              : "hover:bg-accent"
          }`}
          onClick={() => onSelectBox?.(box.id)}
          style={box.color ? { borderColor: box.color } : undefined}
        >
          <CardContent className="p-4 min-w-[120px]">
            <div className="text-sm font-medium">{box.name}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {box.note_count || 0} anotações
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Mensagem de erro (não quebra a página) */}
      {boxesError && (
        <Card className="border-destructive flex-shrink-0">
          <CardContent className="p-4 min-w-[200px]">
            <div className="text-xs text-destructive">
              Erro ao carregar caixinhas
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botão criar */}
      {onCreateBox && (
        <Card className="flex-shrink-0 cursor-pointer hover:bg-accent">
          <CardContent className="p-4 min-w-[120px] flex items-center justify-center">
            <Button variant="ghost" size="sm" onClick={onCreateBox}>
              <Plus className="w-4 h-4 mr-2" />
              Nova
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


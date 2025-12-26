/** Componente para listar caixinhas. */

import { useBoxes } from "../hooks/use-boxes";
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
  const { data: boxes, isLoading } = useBoxes();

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
            {boxes?.filter((b) => !b.box).length || 0} itens
          </div>
        </CardContent>
      </Card>

      {/* Caixinhas */}
      {boxes?.map((box) => (
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
              {box.notes_count} anotações
            </div>
          </CardContent>
        </Card>
      ))}

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


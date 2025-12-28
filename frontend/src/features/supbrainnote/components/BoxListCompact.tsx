/** Lista compacta de caixinhas - Horizontal com scroll. */

import { useBoxes } from "../hooks/use-boxes";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface BoxListCompactProps {
  onSelectBox?: (boxId: string | null) => void;
  selectedBoxId?: string | null;
  onCreateBox?: () => void;
}

export function BoxListCompact({ onSelectBox, selectedBoxId, onCreateBox }: BoxListCompactProps) {
  const { data: boxes, isLoading } = useBoxes();
  const boxesArray = Array.isArray(boxes) ? boxes : [];

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2 px-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-24 flex-shrink-0 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto px-4 scrollbar-hide">
      {/* Inbox */}
      <Card
        className={cn(
          "flex-shrink-0 cursor-pointer transition-all min-w-[120px] h-[80px] border",
          selectedBoxId === null
            ? "bg-accent/30 border-primary/30"
            : "hover:bg-accent/50 border-border/50 hover:border-border"
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log("Inbox clicado - chamando onSelectBox(null)");
          if (onSelectBox) {
            onSelectBox(null);
          }
        }}
      >
        <CardContent className="p-4 h-full flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <div className="text-sm font-semibold text-center">Inbox</div>
        </CardContent>
      </Card>

      {/* Caixinhas */}
      {boxesArray.map((box) => (
        <Card
          key={box.id}
          className={cn(
            "flex-shrink-0 cursor-pointer transition-all min-w-[120px] h-[80px] border",
            selectedBoxId === box.id
              ? "bg-accent/30 border-primary/30"
              : "hover:bg-accent/50 border-border/50 hover:border-border"
          )}
          onClick={() => onSelectBox?.(box.id)}
          style={box.color && selectedBoxId === box.id ? {
            borderColor: box.color,
            backgroundColor: `${box.color}20`,
          } : box.color ? { borderColor: box.color } : undefined}
        >
          <CardContent className="p-4 h-full flex flex-col items-center justify-center">
            <div className="text-sm font-semibold text-center truncate w-full">{box.name}</div>
            <div className="text-xs text-muted-foreground text-center mt-1.5">
              {box.notes_count || 0} {box.notes_count === 1 ? "nota" : "notas"}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Botão criar */}
      {onCreateBox && (
        <Card className="flex-shrink-0 cursor-pointer hover:bg-accent/50 border-dashed border-2 min-w-[120px] h-[80px] transition-all border-border/50 hover:border-border">
          <CardContent className="p-4 h-full flex items-center justify-center" onClick={onCreateBox}>
            <div className="flex flex-col items-center justify-center gap-1.5">
              <Plus className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Nova</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


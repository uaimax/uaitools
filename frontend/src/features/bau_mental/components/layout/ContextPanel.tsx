/** Painel contextual (drawer/modal) para detalhes, edição e metadata. */

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useBauMentalStore } from "../../stores/bau-mental-store";
import type { ReactNode } from "react";

interface ContextPanelProps {
  children?: ReactNode;
  title?: string;
}

export function ContextPanel({ children, title }: ContextPanelProps) {
  const { contextPanelOpen, setContextPanelOpen, contextPanelContent } =
    useBauMentalStore();

  const getTitle = () => {
    if (title) return title;
    switch (contextPanelContent) {
      case "details":
        return "Detalhes";
      case "edit":
        return "Editar";
      case "metadata":
        return "Metadata";
      default:
        return "Painel";
    }
  };

  return (
    <Sheet open={contextPanelOpen} onOpenChange={setContextPanelOpen} side="right">
      <SheetContent>
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>{getTitle()}</SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setContextPanelOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

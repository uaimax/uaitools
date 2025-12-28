/** Modal para consultas com IA. */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QueryInterface } from "./QueryInterface";

interface QueryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QueryModal({ open, onOpenChange }: QueryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Consultar anotações</DialogTitle>
        </DialogHeader>
        <QueryInterface />
      </DialogContent>
    </Dialog>
  );
}



/** Botão para abrir modal de upload de arquivo. */

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUploadModal } from "./FileUploadModal";

interface FileUploadButtonProps {
  boxId?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function FileUploadButton({
  boxId,
  variant = "outline",
  size = "sm",
}: FileUploadButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>
        <Upload className="w-4 h-4 mr-2" />
        Enviar arquivo
      </Button>
      <FileUploadModal open={open} onOpenChange={setOpen} initialBoxId={boxId} />
    </>
  );
}

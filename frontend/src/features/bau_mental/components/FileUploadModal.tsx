/** Modal para upload de arquivos para caixinha. */

import { useState, useRef } from "react";
import { Upload, FileText, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useUploadFile } from "../hooks/use-notes";
import { useBoxes } from "../hooks/use-boxes";
import { toast } from "@/hooks/use-toast";
import { Select, SelectItem } from "@/components/ui/select";
import { FilePreview } from "./FilePreview";
import { FileProcessingOptions } from "./FileProcessingOptions";

interface FileUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialBoxId?: string;
}

type ProcessingMode = "single" | "split_paragraphs" | "split_lines";

export function FileUploadModal({
  open,
  onOpenChange,
  initialBoxId,
}: FileUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [selectedBoxId, setSelectedBoxId] = useState<string | undefined>(
    initialBoxId
  );
  const [processingMode, setProcessingMode] =
    useState<ProcessingMode>("single");
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFileMutation = useUploadFile();
  const { data: boxes } = useBoxes();
  const boxesArray = Array.isArray(boxes) ? boxes : [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validar tipo de arquivo
    const allowedTypes = [
      ".txt",
      ".md",
      ".docx",
      ".pdf",
      ".srt",
      ".vtt",
      ".csv",
      ".json",
    ];
    const ext = selectedFile.name
      .toLowerCase()
      .substring(selectedFile.name.lastIndexOf("."));
    if (!allowedTypes.includes(ext)) {
      toast({
        title: "Erro",
        description: `Tipo de arquivo não suportado. Tipos permitidos: ${allowedTypes.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);

    // Preview para arquivos de texto
    if ([".txt", ".md", ".csv", ".json"].includes(ext)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsText(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo",
        variant: "destructive",
      });
      return;
    }

    try {
      await uploadFileMutation.mutateAsync({
        file,
        box_id: selectedBoxId || undefined,
        processing_mode: processingMode,
      });
      toast({
        title: "Sucesso",
        description: "Arquivo enviado com sucesso!",
      });
      handleClose();
    } catch (error: any) {
      toast({
        title: "Erro",
        description:
          error?.response?.data?.error || "Não foi possível enviar o arquivo",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setSelectedBoxId(initialBoxId);
    setProcessingMode("single");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Enviar Arquivo
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {/* Caixinha */}
          <div>
            <Label htmlFor="box-select">Caixinha (opcional)</Label>
            <Select
              value={selectedBoxId || ""}
              onChange={(value) => setSelectedBoxId(value || undefined)}
              placeholder="Selecione uma caixinha (ou deixe vazio para Inbox)"
            >
              <SelectItem value="">Inbox</SelectItem>
              {boxesArray.map((box) => (
                <SelectItem key={box.id} value={box.id}>
                  {box.name}
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* Seleção de arquivo */}
          <div>
            <Label htmlFor="file-input">Arquivo</Label>
            <Input
              id="file-input"
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.docx,.pdf,.srt,.vtt,.csv,.json"
              onChange={handleFileSelect}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Formatos suportados: .txt, .md, .docx, .pdf, .srt, .vtt, .csv, .json
            </p>
          </div>

          {/* Preview */}
          {preview && <FilePreview content={preview} />}

          {/* Opções de processamento */}
          {file && (
            <FileProcessingOptions
              value={processingMode}
              onChange={setProcessingMode}
            />
          )}
        </div>

        {/* Ações */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || uploadFileMutation.isPending}
          >
            {uploadFileMutation.isPending ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

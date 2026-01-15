/** Modal unificada para adicionar arquivos ou texto. */

import { useState, useRef } from "react";
import { Upload, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useUploadFile, useCreateTextNote } from "../hooks/use-notes";
import { useBoxes } from "../hooks/use-boxes";
import { toast } from "@/hooks/use-toast";
import { Select, SelectItem } from "@/components/ui/select";
import { FilePreview } from "./FilePreview";
import { FileProcessingOptions } from "./FileProcessingOptions";

interface FileAndTextModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialBoxId?: string;
}

type ProcessingMode = "single" | "split_paragraphs" | "split_lines";

export function FileAndTextModal({
  open,
  onOpenChange,
  initialBoxId,
}: FileAndTextModalProps) {
  const [activeTab, setActiveTab] = useState<"file" | "text">("file");
  
  // Estado para arquivo
  const [file, setFile] = useState<File | null>(null);
  const [processingMode, setProcessingMode] = useState<ProcessingMode>("single");
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estado para texto
  const [text, setText] = useState("");
  
  // Estado compartilhado
  const [selectedBoxId, setSelectedBoxId] = useState<string | undefined>(
    initialBoxId
  );

  const uploadFileMutation = useUploadFile();
  const createTextNoteMutation = useCreateTextNote();
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

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setText(clipboardText);
      toast({
        title: "Texto colado",
        description: "Texto da área de transferência foi colado",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível acessar a área de transferência",
        variant: "destructive",
      });
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

  const handleCreateText = async () => {
    if (!text.trim()) {
      toast({
        title: "Erro",
        description: "Digite ou cole algum texto",
        variant: "destructive",
      });
      return;
    }

    try {
      await createTextNoteMutation.mutateAsync({
        text: text.trim(),
        box_id: selectedBoxId || undefined,
      });
      toast({
        title: "Sucesso",
        description: "Nota criada com sucesso!",
      });
      handleClose();
    } catch (error: any) {
      toast({
        title: "Erro",
        description:
          error?.response?.data?.error || "Não foi possível criar a nota",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setText("");
    setSelectedBoxId(initialBoxId);
    setProcessingMode("single");
    setActiveTab("file");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onOpenChange(false);
  };

  const isFileTabValid = !!file;
  const isTextTabValid = !!text.trim();
  const isPending = uploadFileMutation.isPending || createTextNoteMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Adicionar arquivos
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "file" | "text")} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">Arquivo</TabsTrigger>
            <TabsTrigger value="text">Texto</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto space-y-4 mt-4">
            {/* Caixinha (compartilhada entre as duas abas) */}
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

            {/* Conteúdo da aba Arquivo */}
            <TabsContent value="file" className="space-y-4 mt-0">
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
            </TabsContent>

            {/* Conteúdo da aba Texto */}
            <TabsContent value="text" className="space-y-4 mt-0">
              {/* Texto */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="text-input">Texto</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePaste}
                    className="h-7 text-xs"
                  >
                    Colar da área de transferência
                  </Button>
                </div>
                <Textarea
                  id="text-input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Cole ou digite o texto aqui... (transcripts, reflexões, atas, etc)"
                  className="min-h-[300px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {text.length} caracteres
                </p>
              </div>

              {/* Preview (opcional) */}
              {text.length > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs font-semibold mb-2">Preview:</p>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {text.substring(0, 200)}
                    {text.length > 200 ? "..." : ""}
                  </p>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* Ações */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          {activeTab === "file" ? (
            <Button
              onClick={handleUpload}
              disabled={!isFileTabValid || isPending}
            >
              {isPending ? "Enviando..." : "Enviar"}
            </Button>
          ) : (
            <Button
              onClick={handleCreateText}
              disabled={!isTextTabValid || isPending}
            >
              {isPending ? "Criando..." : "Criar Nota"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Modal para ingestão de texto (web-first). */

import { useState } from "react";
import { FileText, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCreateTextNote } from "../hooks/use-notes";
import { useBoxes } from "../hooks/use-boxes";
import { toast } from "@/hooks/use-toast";
import { Select, SelectItem } from "@/components/ui/select";

interface TextIngestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialBoxId?: string;
}

export function TextIngestionModal({
  open,
  onOpenChange,
  initialBoxId,
}: TextIngestionModalProps) {
  const [text, setText] = useState("");
  const [selectedBoxId, setSelectedBoxId] = useState<string | undefined>(
    initialBoxId
  );
  const createTextNoteMutation = useCreateTextNote();
  const { data: boxes } = useBoxes();
  const boxesArray = Array.isArray(boxes) ? boxes : [];

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

  const handleCreate = async () => {
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
      setText("");
      setSelectedBoxId(initialBoxId);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description:
          error?.response?.data?.error || "Não foi possível criar a nota",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Adicionar Texto
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
        </div>

        {/* Ações */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!text.trim() || createTextNoteMutation.isPending}
          >
            {createTextNoteMutation.isPending ? "Criando..." : "Criar Nota"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Editor inline de nota - Modo edição automático inspirado em Google Keep/Notion. */

import { useState, useEffect, useRef } from "react";
import { useUpdateNote } from "../hooks/use-notes";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Note } from "../hooks/use-notes";

interface NoteEditorProps {
  note: Note;
  onBack?: () => void;
  onClose?: () => void;
  autoFocus?: boolean;
}

export function NoteEditor({ note, onBack, onClose, autoFocus = true }: NoteEditorProps) {
  const [transcript, setTranscript] = useState(note.transcript || "");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const updateMutation = useUpdateNote();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Atualizar transcript quando note mudar
  useEffect(() => {
    setTranscript(note.transcript || "");
    setHasChanges(false);
  }, [note.id, note.transcript]);

  // Auto-focus no textarea
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
      // Mover cursor para o final
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [autoFocus, note.id]);

  // Auto-save com debounce (2 segundos)
  useEffect(() => {
    if (!hasChanges || transcript === (note.transcript || "")) {
      return;
    }

    // Limpar timeout anterior
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Criar novo timeout
    saveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [transcript, hasChanges, note.transcript]);

  const handleSave = async () => {
    if (transcript === (note.transcript || "") || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({
        id: note.id,
        transcript,
      });
      setHasChanges(false);
      toast({
        title: "Nota salva",
        description: "Suas alterações foram salvas automaticamente.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a nota. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (value: string) => {
    setTranscript(value);
    setHasChanges(value !== (note.transcript || ""));
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm("Descartar alterações não salvas?")) {
        setTranscript(note.transcript || "");
        setHasChanges(false);
        onClose?.();
      }
    } else {
      onClose?.();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Cabeçalho minimalista */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="text-xs text-muted-foreground">Salvando...</span>
          )}
          {hasChanges && !isSaving && (
            <span className="text-xs text-muted-foreground">Não salvo</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Área de edição - foco no conteúdo */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          {/* Transcrição editável */}
          <Textarea
            ref={textareaRef}
            value={transcript}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Digite sua nota..."
            className="min-h-[400px] text-base leading-relaxed border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none p-0"
            style={{
              fontSize: "1rem",
              lineHeight: "1.75",
            }}
          />
        </div>
      </div>

      {/* Barra inferior discreta (opcional - pode ser expandida depois) */}
      <div className="border-t px-4 py-2 bg-muted/30">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <div>
            {note.created_by_email && (
              <span>Criado por {note.created_by_email}</span>
            )}
            {note.last_edited_by_email && note.created_by_email !== note.last_edited_by_email && (
              <span className="ml-2">
                • Editado por {note.last_edited_by_email}
                {note.last_edited_at && (
                  <span className="ml-1">
                    em {new Date(note.last_edited_at).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </span>
            )}
          </div>
          <div>
            {note.created_at && (
              <span>
                {new Date(note.created_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


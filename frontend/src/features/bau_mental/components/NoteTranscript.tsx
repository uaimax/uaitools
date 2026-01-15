/** Transcript editável da nota. */

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useUpdateNote } from "../hooks/use-notes";
import { toast } from "@/hooks/use-toast";
import type { Note } from "../hooks/use-notes";

interface NoteTranscriptProps {
  note: Note;
}

export function NoteTranscript({ note }: NoteTranscriptProps) {
  // Limpar prefixos estranhos do transcript
  const cleanTranscript = (text: string) => {
    if (!text) return "";
    return text
      .replace(/^""txt\s*/i, "") // Remove prefixo ""txt
      .replace(/^txt\s*/i, "") // Remove prefixo txt
      .replace(/^\s+|\s+$/g, "") // Remove espaços no início/fim
      .trim();
  };

  const [transcript, setTranscript] = useState(cleanTranscript(note.transcript || ""));
  const [isEditing, setIsEditing] = useState(false);
  const updateMutation = useUpdateNote();

  // Atualizar quando note mudar
  useEffect(() => {
    setTranscript(cleanTranscript(note.transcript || ""));
  }, [note.id, note.transcript]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: note.id,
        transcript,
      });
      toast({
        title: "Sucesso",
        description: "Nota atualizada!",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a nota.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Transcrição</h2>
        {isEditing && (
          <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        )}
      </div>

      {isEditing ? (
        <Textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          className="min-h-[200px] font-mono text-sm"
          placeholder="Digite ou edite a transcrição..."
        />
      ) : (
        <div
          className="p-4 bg-muted rounded-lg min-h-[200px] cursor-text whitespace-pre-wrap break-words"
          onClick={() => setIsEditing(true)}
        >
          {transcript ? (
            <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">
              {transcript}
            </pre>
          ) : (
            <p className="text-muted-foreground italic">
              Clique para editar a transcrição...
            </p>
          )}
        </div>
      )}
    </div>
  );
}

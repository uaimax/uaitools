/** Gerador de resumos automáticos. */

import { useState } from "react";
import { Sparkles, Pin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useGenerateBoxSummary, useGenerateNotesSummary } from "../hooks/use-summaries";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface SummaryGeneratorProps {
  boxId?: string;
  noteIds?: string[];
  onPin?: (summary: string) => void;
}

export function SummaryGenerator({
  boxId,
  noteIds,
  onPin,
}: SummaryGeneratorProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const boxSummaryMutation = useGenerateBoxSummary();
  const notesSummaryMutation = useGenerateNotesSummary();

  const handleGenerate = async () => {
    setIsGenerating(true);
    setSummary(null);

    try {
      let result;
      if (boxId) {
        result = await boxSummaryMutation.mutateAsync(boxId);
      } else if (noteIds && noteIds.length > 0) {
        result = await notesSummaryMutation.mutateAsync(noteIds);
      } else {
        toast({
          title: "Erro",
          description: "Selecione uma caixinha ou notas",
          variant: "destructive",
        });
        return;
      }

      setSummary(result.summary || result.answer || "Resumo gerado");
    } catch (error: any) {
      toast({
        title: "Erro",
        description:
          error?.response?.data?.error || "Não foi possível gerar resumo",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePin = () => {
    if (summary && onPin) {
      onPin(summary);
      toast({
        title: "Sucesso",
        description: "Resumo fixado!",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Gerar Resumo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || (!boxId && (!noteIds || noteIds.length === 0))}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Resumo
            </>
          )}
        </Button>

        {summary && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Resumo gerado:</p>
              <div className="flex gap-2">
                {onPin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePin}
                  >
                    <Pin className="w-3 h-3 mr-1" />
                    Fixar
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSummary(null)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{summary}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

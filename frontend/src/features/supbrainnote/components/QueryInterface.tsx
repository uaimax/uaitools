/** Componente para consultas inteligentes com IA. */

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQueryAI } from "../hooks/use-query";
import { Skeleton } from "@/components/ui/skeleton";

export function QueryInterface() {
  const [question, setQuestion] = useState("");
  const queryMutation = useQueryAI();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || queryMutation.isPending) return;

    try {
      await queryMutation.mutateAsync({
        question: question.trim(),
        limit: 10,
      });
    } catch (error) {
      console.error("Erro ao consultar:", error);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          placeholder="O que já foi dito sobre...?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          disabled={queryMutation.isPending}
        />
        <Button
          type="submit"
          disabled={!question.trim() || queryMutation.isPending}
          className="w-full"
        >
          {queryMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Consultando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Perguntar
            </>
          )}
        </Button>
      </form>

      {queryMutation.isPending && (
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      )}

      {queryMutation.data && (
        <Card>
          <CardHeader>
            <CardTitle>Resposta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm whitespace-pre-wrap">
              {queryMutation.data.answer}
            </p>

            {queryMutation.data.sources.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Fontes:</div>
                {queryMutation.data.sources.map((source, idx) => (
                  <Card key={idx} className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline">{source.box_name}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {source.date}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {source.excerpt}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {queryMutation.error && (
        <Card className="border-destructive">
          <CardContent className="p-6">
            <p className="text-sm text-destructive">
              Erro ao consultar: {queryMutation.error.message}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}



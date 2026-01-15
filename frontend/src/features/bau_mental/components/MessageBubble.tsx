/** Bubble de mensagem estilo chat. */

import { User, Bot, Copy, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ThreadMessage } from "../hooks/use-thread";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

interface MessageBubbleProps {
  message: ThreadMessage;
  onPin?: () => void;
}

export function MessageBubble({ message, onPin }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast({
        title: "Copiado!",
        description: "Resposta copiada para a área de transferência",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar",
        variant: "destructive",
      });
    }
  };

  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-primary" />
        </div>
      )}

      <div className={`flex-1 max-w-[80%] ${isUser ? "order-2" : ""}`}>
        <Card
          className={
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          }
        >
          <CardContent className="p-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>

            {/* Notas referenciadas */}
            {message.notes_referenced && message.notes_referenced.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs font-semibold mb-2">Notas referenciadas:</p>
                <div className="flex flex-wrap gap-1">
                  {message.notes_referenced.map((noteId) => (
                    <Badge
                      key={noteId}
                      variant="outline"
                      className="text-xs cursor-pointer hover:bg-accent"
                      onClick={() => {
                        // TODO: Navegar para nota
                        console.log("Ver nota:", noteId);
                      }}
                    >
                      {noteId.substring(0, 8)}...
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Ações */}
            {!isUser && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-7 text-xs"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  {copied ? "Copiado!" : "Copiar"}
                </Button>
                {onPin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onPin}
                    className="h-7 text-xs"
                  >
                    <Pin className="w-3 h-3 mr-1" />
                    Fixar
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground mt-1 px-1">
          {new Date(message.created_at).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-primary-foreground" />
        </div>
      )}
    </div>
  );
}

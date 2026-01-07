/** Zona 3: Chat Contextual - Conversa com IA sobre investimentos. */

import { useState, useEffect, useRef } from "react";
import { Send, Loader2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePortfolioChat, useSendChatMessage } from "../hooks/use-smart-investments";
import { cn } from "@/lib/utils";

interface ChatZoneProps {
  portfolioId: string | null;
}

const SUGGESTED_QUESTIONS = [
  "Qual ativo rendeu mais?",
  "Devo vender alguma coisa?",
  "O que significa dividendos?",
  "Como está o mercado hoje?",
];

export function ChatZone({ portfolioId }: ChatZoneProps) {
  const [message, setMessage] = useState("");
  const { data: messages = [], isLoading } = usePortfolioChat(portfolioId);
  const sendMessage = useSendChatMessage();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !portfolioId) return;

    try {
      await sendMessage.mutateAsync({
        portfolioId,
        message: message.trim(),
      });
      setMessage("");
    } catch (error) {
      // Erro já tratado pelo hook
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setMessage(question);
  };

  return (
    <Card className="flex flex-col h-full">
      <CardContent className="p-6 flex flex-col flex-1 min-h-0">
        <h2 className="text-xl font-semibold mb-4">Pergunte sobre seus investimentos</h2>

        <ScrollArea className="flex-1 mb-4" ref={scrollRef}>
          <div className="space-y-4 pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="space-y-4">
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">Comece uma conversa ou escolha uma pergunta:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {SUGGESTED_QUESTIONS.map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestedQuestion(question)}
                        className="text-xs"
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    msg.is_from_user ? "justify-end" : "justify-start"
                  )}
                >
                  {!msg.is_from_user && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg p-3",
                      msg.is_from_user
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  </div>
                  {msg.is_from_user && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite sua pergunta..."
            disabled={sendMessage.isPending || !portfolioId}
          />
          <Button type="submit" disabled={sendMessage.isPending || !message.trim() || !portfolioId}>
            {sendMessage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}




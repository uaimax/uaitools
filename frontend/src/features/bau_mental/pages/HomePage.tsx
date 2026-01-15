/** Página inicial - Interface estilo ChatGPT para criar conversas. */

import { useState } from "react";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useCreateThread, useAddThreadMessage } from "../hooks/use-thread";
import { toast } from "@/hooks/use-toast";

export function HomePage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const createThreadMutation = useCreateThread();
  const addMessageMutation = useAddThreadMessage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    try {
      // Criar thread global com a pergunta como título
      const newThread = await createThreadMutation.mutateAsync({
        is_global: true,
        title: trimmed.substring(0, 50),
      });

      const threadId = newThread?.id || newThread?.data?.id;
      if (!threadId) {
        throw new Error("Thread criada mas ID não encontrado");
      }

      // Enviar a mensagem imediatamente após criar a thread
      try {
        await addMessageMutation.mutateAsync({
          threadId,
          content: trimmed,
        });
      } catch (messageError: any) {
        console.error("Erro ao enviar mensagem:", messageError);
        // Mesmo se falhar ao enviar mensagem, navegar para a thread
        toast({
          title: "Aviso",
          description: "Conversa criada, mas houve erro ao enviar a mensagem. Tente novamente.",
          variant: "destructive",
        });
      }

      // Navegar para a thread (sem query, pois já enviamos a mensagem)
      navigate(`/bau-mental/thread/${threadId}`);
    } catch (error: any) {
      console.error("Erro ao criar conversa:", error);
      toast({
        title: "Erro",
        description: error?.response?.data?.error || error?.message || "Não foi possível criar a conversa",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-3xl space-y-8">
        {/* Título */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-semibold">
            O que deseja perguntar para seu Baú Mental?
          </h1>
          <p className="text-muted-foreground">
            Faça uma pergunta e comece uma conversa com todo o seu acervo
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ex: O que já foi dito sobre o projeto X? Quais são as principais decisões que tomamos?"
              className="min-h-[120px] resize-none text-base"
              disabled={createThreadMutation.isPending}
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              size="lg"
              disabled={!message.trim() || createThreadMutation.isPending || addMessageMutation.isPending}
            >
              {createThreadMutation.isPending || addMessageMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {createThreadMutation.isPending ? "Criando..." : "Enviando..."}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

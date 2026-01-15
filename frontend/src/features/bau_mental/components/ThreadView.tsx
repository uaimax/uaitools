/** View de thread (chat com histórico) - Estilo ChatGPT. */

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageBubble } from "./MessageBubble";
import {
  useThread,
  useThreadMessages,
  useCreateThread,
  useAddThreadMessage,
  usePinThreadSummary,
} from "../hooks/use-thread";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQueryClient } from "@tanstack/react-query";

interface ThreadViewProps {
  boxId: string | null;
}

export function ThreadView({ boxId }: ThreadViewProps) {
  const { id } = useParams<{ id?: string }>();
  const threadId = id || null; // Garantir que seja null quando undefined
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("query");
  const [message, setMessage] = useState(initialQuery || "");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasSentInitialQuery = useRef(false);

  const { data: thread, isLoading: threadLoading } = useThread(threadId);
  const { data: messages, isLoading: messagesLoading } = useThreadMessages(threadId);
  const createThreadMutation = useCreateThread();
  const addMessageMutation = useAddThreadMessage();
  const pinSummaryMutation = usePinThreadSummary();

  const messagesArray = Array.isArray(messages) ? messages : [];

  // Scroll para o final quando novas mensagens chegarem
  useEffect(() => {
    if (messagesArray.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messagesArray.length]);

  // Refetch thread quando mensagens mudarem para atualizar título
  const queryClient = useQueryClient();
  useEffect(() => {
    if (threadId && messagesArray.length > 0) {
      // Invalidar query da thread para refetch e atualizar título
      queryClient.invalidateQueries({
        queryKey: ["bau_mental", "threads", threadId],
      });
    }
  }, [threadId, messagesArray.length, queryClient]);

  // Enviar query inicial automaticamente se houver
  useEffect(() => {
    if (initialQuery && threadId && !hasSentInitialQuery.current && messagesArray.length === 0 && !threadLoading) {
      hasSentInitialQuery.current = true;
      // Pequeno delay para garantir que a thread está carregada
      const timer = setTimeout(async () => {
        const content = initialQuery.trim();
        if (!content) return;

        try {
          await addMessageMutation.mutateAsync({
            threadId,
            content,
          });
          // Limpar query da URL após enviar
          navigate(`/bau-mental/thread/${threadId}`, { replace: true });
        } catch (error: any) {
          console.error("Erro ao enviar mensagem inicial:", error);
          const errorMessage = error?.response?.data?.error || error?.response?.data?.detail || error?.message;
          toast({
            title: "Erro ao processar pergunta",
            description: errorMessage || "Não foi possível processar sua pergunta. Verifique se está autenticado e se o workspace está configurado corretamente.",
            variant: "destructive",
          });
          // Limpar query mesmo em caso de erro para não ficar tentando
          navigate(`/bau-mental/thread/${threadId}`, { replace: true });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [threadId, initialQuery, messagesArray.length, threadLoading, addMessageMutation, navigate]);

  const handleNewThread = async () => {
    try {
      const data: any = {};
      if (boxId) {
        data.box_id = boxId;
      } else {
        data.is_global = true;
      }

      const newThread = await createThreadMutation.mutateAsync(data);
      console.log("Thread criada:", newThread);
      
      // Verificar se o ID existe antes de navegar
      const threadId = newThread?.id || newThread?.data?.id;
      if (threadId) {
        navigate(`/bau-mental/thread/${threadId}`);
      } else {
        console.error("Thread criada mas sem ID:", newThread);
        toast({
          title: "Erro",
          description: "Thread criada mas ID não encontrado. Tente recarregar a página.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Erro ao criar thread:", error);
      toast({
        title: "Erro",
        description: error?.response?.data?.error || "Não foi possível criar thread",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !threadId) return;

    const content = message.trim();
    setMessage("");

    try {
      await addMessageMutation.mutateAsync({
        threadId,
        content,
      });

      // Aguardar um pouco para as queries refetcharem
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 500);
    } catch (error: any) {
      toast({
        title: "Erro",
        description:
          error?.response?.data?.error || "Não foi possível enviar mensagem",
        variant: "destructive",
      });
      setMessage(content); // Restaurar mensagem em caso de erro
    }
  };

  const handlePinSummary = async (messageContent: string) => {
    if (!threadId) return;

    try {
      await pinSummaryMutation.mutateAsync({
        threadId,
        summary: messageContent,
      });
      toast({
        title: "Sucesso",
        description: "Síntese fixada!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível fixar síntese",
        variant: "destructive",
      });
    }
  };

  if (threadLoading || messagesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  // Se não há thread, mostrar área vazia
  if (!threadId || !thread) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md px-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-semibold">Nenhuma thread selecionada</p>
            <p className="text-sm text-muted-foreground mt-2">
              Crie uma nova thread para começar uma conversa com seu acervo
            </p>
          </div>
          <Button onClick={handleNewThread} className="mt-4">
            <MessageSquare className="w-4 h-4 mr-2" />
            Nova conversa
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">

      {/* Área principal - Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b p-4">
          <h1 className="text-xl font-semibold">{thread.title}</h1>
          {thread.pinned_summary && (
            <div className="mt-2 p-2 bg-muted rounded text-sm">
              <p className="font-semibold mb-1">Síntese fixada:</p>
              <p className="text-muted-foreground">{thread.pinned_summary}</p>
            </div>
          )}
        </div>

        {/* Mensagens */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {messagesArray.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <p>Nenhuma mensagem ainda</p>
                <p className="text-sm mt-2">
                  Comece fazendo uma pergunta sobre suas notas
                </p>
              </div>
            ) : (
              <>
                {messagesArray.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    onPin={
                      msg.role === "assistant"
                        ? () => handlePinSummary(msg.content)
                        : undefined
                    }
                  />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}

            {/* Indicador de digitação */}
            {addMessageMutation.isPending && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">
                    Processando...
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Digite sua pergunta..."
              className="min-h-[60px] resize-none"
              disabled={addMessageMutation.isPending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || addMessageMutation.isPending}
              size="lg"
            >
              {addMessageMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

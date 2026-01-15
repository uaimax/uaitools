/** Sidebar com lista de caixinhas, Inbox, Global e Conversas. */

import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Plus, Inbox, Globe, Box, Home, MessageSquare, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useBoxes } from "../../hooks/use-boxes";
import { useBauMentalStore } from "../../stores/bau-mental-store";
import { useCreateBox } from "../../hooks/use-boxes";
import { useThreads, useCreateThread } from "../../hooks/use-thread";
import { useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/config/api";

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: threadId } = useParams<{ id?: string }>();
  const { data: boxes } = useBoxes();
  
  // Buscar apenas a contagem do inbox, sem refetchInterval para evitar loops
  const { data: inboxNotes } = useQuery({
    queryKey: ["bau_mental", "notes", { inbox: true }],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/bau-mental/notes/?inbox=true");
        const data = response.data?.results || response.data || [];
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Erro ao buscar anotações:", error);
        return [];
      }
    },
    retry: 1,
    // Sem refetchInterval para evitar re-renders constantes
  });
  
  const { selectedBoxId, setSelectedBoxId } = useBauMentalStore();
  const createBoxMutation = useCreateBox();
  const createThreadMutation = useCreateThread();
  const [showCreateBox, setShowCreateBox] = useState(false);
  const [newBoxName, setNewBoxName] = useState("");
  const [threadSearchQuery, setThreadSearchQuery] = useState("");
  const [showMoreThreads, setShowMoreThreads] = useState(false);

  // Detectar se estamos em uma página de thread e qual boxId (se houver)
  const isThreadPage = location.pathname.startsWith("/bau-mental/thread");
  const searchParams = new URLSearchParams(location.search);
  const threadBoxId = searchParams.get("box") || null;
  
  // Buscar threads (globais ou de uma caixinha específica)
  const { data: threads } = useThreads(
    threadBoxId ? { box: threadBoxId } : { global: true },
    { enabled: isThreadPage }
  );
  const threadsArray = Array.isArray(threads) ? threads : [];
  const filteredThreads = threadsArray.filter((thread) =>
    thread.title.toLowerCase().includes(threadSearchQuery.toLowerCase())
  );
  const displayedThreads = showMoreThreads ? filteredThreads : filteredThreads.slice(0, 10);
  const hasMoreThreads = filteredThreads.length > 10;

  const inboxCount = Array.isArray(inboxNotes) ? inboxNotes.length : 0;
  const boxesArray = Array.isArray(boxes) ? boxes : [];

  // Usar useCallback para evitar re-criação de funções
  const handleBoxClick = useCallback(
    (boxId: string) => {
      setSelectedBoxId(boxId);
      navigate(`/bau-mental/box/${boxId}`);
    },
    [navigate, setSelectedBoxId]
  );

  const handleInboxClick = useCallback(() => {
    setSelectedBoxId(null);
    navigate("/bau-mental/inbox");
  }, [navigate, setSelectedBoxId]);

  const handleGlobalClick = useCallback(() => {
    setSelectedBoxId(null);
    navigate("/bau-mental/global");
  }, [navigate, setSelectedBoxId]);

  const handleHomeClick = useCallback(() => {
    setSelectedBoxId(null);
    navigate("/bau-mental/home");
  }, [navigate, setSelectedBoxId]);

  const handleNewThread = useCallback(async () => {
    try {
      const data: any = {};
      if (threadBoxId) {
        data.box_id = threadBoxId;
      } else {
        data.is_global = true;
      }

      const newThread = await createThreadMutation.mutateAsync(data);
      const threadId = newThread?.id || newThread?.data?.id;
      if (threadId) {
        navigate(`/bau-mental/thread/${threadId}`);
      } else {
        toast({
          title: "Erro",
          description: "Thread criada mas ID não encontrado",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.response?.data?.error || "Não foi possível criar thread",
        variant: "destructive",
      });
    }
  }, [threadBoxId, createThreadMutation, navigate]);

  const handleThreadClick = useCallback((threadId: string) => {
    navigate(`/bau-mental/thread/${threadId}`);
  }, [navigate]);

  const handleCreateBox = async () => {
    if (!newBoxName.trim()) return;

    try {
      await createBoxMutation.mutateAsync({ name: newBoxName.trim() });
      toast({
        title: "Sucesso",
        description: "Caixinha criada com sucesso!",
      });
      setNewBoxName("");
      setShowCreateBox(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar a caixinha.",
        variant: "destructive",
      });
    }
  };

  // Verificações de ativo memoizadas
  const isHomeActive = location.pathname === "/bau-mental/home" || location.pathname === "/bau-mental";
  const isInboxActive = location.pathname === "/bau-mental/inbox" || location.pathname.startsWith("/bau-mental/inbox/");
  const isGlobalActive = location.pathname === "/bau-mental/global" || location.pathname.startsWith("/bau-mental/global/");
  const isThreadActive = isThreadPage;

  // Memoizar conteúdo do ScrollArea para evitar re-renders
  const scrollContent = useMemo(
    () => (
      <div className="p-2 space-y-1">
        {/* Início */}
        <Button
          variant={isHomeActive ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={handleHomeClick}
        >
          <Home className="w-4 h-4 mr-2" />
          Início
        </Button>

        {/* Inbox */}
        <Button
          variant={isInboxActive ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={handleInboxClick}
        >
          <Inbox className="w-4 h-4 mr-2" />
          Caixa de Entrada
          {inboxCount > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {inboxCount > 9 ? "9+" : inboxCount}
            </Badge>
          )}
        </Button>

        {/* Global */}
        <Button
          variant={isGlobalActive ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={handleGlobalClick}
        >
          <Globe className="w-4 h-4 mr-2" />
          Todas as notas
        </Button>

        {/* Separador */}
        {boxesArray.length > 0 && (
          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
            Caixinhas
          </div>
        )}

        {/* Lista de Caixinhas */}
        {boxesArray.map((box) => {
          const isBoxActive = location.pathname === `/bau-mental/box/${box.id}`;
          return (
            <Button
              key={box.id}
              variant={isBoxActive ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => handleBoxClick(box.id)}
            >
              <Box className="w-4 h-4 mr-2" />
              <span className="flex-1 text-left truncate">{box.name}</span>
              {box.note_count > 0 && (
                <Badge variant="outline" className="ml-auto">
                  {box.note_count}
                </Badge>
              )}
            </Button>
          );
        })}

        {boxesArray.length === 0 && (
          <div className="px-2 py-4 text-sm text-muted-foreground text-center">
            Nenhuma caixinha ainda
          </div>
        )}
      </div>
    ),
    [isHomeActive, isInboxActive, isGlobalActive, inboxCount, boxesArray, handleHomeClick, handleInboxClick, handleGlobalClick, handleBoxClick, location.pathname]
  );

  // Memoizar seção de conversas
  const conversationsSection = useMemo(
    () => (
      <div className="p-2 space-y-2">
        {/* Buscar conversa */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversa"
            value={threadSearchQuery}
            onChange={(e) => setThreadSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        {/* Lista de threads */}
        <div className="space-y-1">
          {displayedThreads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => handleThreadClick(thread.id)}
              className={`w-full text-left p-2 rounded-lg hover:bg-accent transition-colors ${
                threadId === thread.id ? "bg-accent" : ""
              }`}
            >
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{thread.title}</p>
                  {thread.last_message_preview && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                      {thread.last_message_preview}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}

          {displayedThreads.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {threadSearchQuery ? "Nenhuma conversa encontrada" : "Nenhuma conversa ainda"}
            </div>
          )}

          {hasMoreThreads && !showMoreThreads && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center text-xs"
              onClick={() => setShowMoreThreads(true)}
            >
              <ChevronDown className="w-3 h-3 mr-1" />
              ver mais
            </Button>
          )}
        </div>
      </div>
    ),
    [threadSearchQuery, displayedThreads, threadId, hasMoreThreads, showMoreThreads, handleThreadClick]
  );

  return (
    <>
      <div className="w-[250px] border-r border-border bg-card/50 flex flex-col h-full relative z-10">
        {/* Header da Sidebar */}
        <div className="p-4 border-b border-border space-y-2 flex-shrink-0">
          {isThreadPage ? (
            <Button
              onClick={handleNewThread}
              className="w-full justify-start"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova conversa
            </Button>
          ) : (
            <Button
              onClick={() => setShowCreateBox(true)}
              className="w-full justify-start"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova caixinha
            </Button>
          )}
        </div>

        {/* Lista de Navegação */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {scrollContent}
        </div>

        {/* Seção de Conversas (apenas em páginas de thread) */}
        {isThreadPage && (
          <>
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase border-t border-border">
              Conversas
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {conversationsSection}
            </div>
          </>
        )}
      </div>

      {/* Modal: Criar Caixinha */}
      <Dialog open={showCreateBox} onOpenChange={setShowCreateBox}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar nova caixinha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="box-name">Nome da caixinha</Label>
              <Input
                id="box-name"
                value={newBoxName}
                onChange={(e) => setNewBoxName(e.target.value)}
                placeholder="Ex: Casa, Trabalho, UAIZOUK..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateBox();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateBox(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateBox}
                disabled={!newBoxName.trim() || createBoxMutation.isPending}
              >
                {createBoxMutation.isPending ? "Criando..." : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
}

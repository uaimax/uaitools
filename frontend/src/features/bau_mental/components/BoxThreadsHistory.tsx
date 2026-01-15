/** Drawer com histórico de conversas de uma caixinha. */

import { MessageSquare, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useThreads } from "../hooks/use-thread";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface BoxThreadsHistoryProps {
  boxId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BoxThreadsHistory({
  boxId,
  open,
  onOpenChange,
}: BoxThreadsHistoryProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: threads, isLoading } = useThreads({ box: boxId });
  const threadsArray = Array.isArray(threads) ? threads : [];

  const filteredThreads = threadsArray.filter((thread) =>
    thread.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleThreadClick = (threadId: string) => {
    navigate(`/bau-mental/thread/${threadId}`);
    onOpenChange(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return "Agora";
    } else if (diffDays === 0) {
      return "Hoje";
    } else if (diffDays === 1) {
      return "Ontem";
    } else if (diffDays < 7) {
      return `${diffDays} dias atrás`;
    } else {
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Histórico de Conversas
            </SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Busca */}
          <div className="relative">
            <Input
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>

          {/* Lista de Threads */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Carregando...</p>
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "Nenhuma conversa encontrada"
                  : "Nenhuma conversa ainda"}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Clique em "Conversar" para iniciar uma nova conversa
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-2 pr-4">
                {filteredThreads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => handleThreadClick(thread.id)}
                    className="w-full text-left p-4 rounded-lg border border-border hover:bg-accent transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                        <MessageSquare className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium truncate">
                            {thread.title}
                          </p>
                          {thread.last_message_at && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                              <Clock className="w-3 h-3" />
                              {formatDate(thread.last_message_at)}
                            </span>
                          )}
                        </div>
                        {thread.last_message_preview && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {thread.last_message_preview}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>
                            {thread.messages_count}{" "}
                            {thread.messages_count === 1
                              ? "mensagem"
                              : "mensagens"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

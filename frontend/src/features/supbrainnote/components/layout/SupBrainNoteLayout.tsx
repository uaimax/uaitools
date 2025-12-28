/** Layout mínimo para SupBrainNote - Single-purpose app. */

import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Settings, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotes } from "../../hooks/use-notes";

interface SupBrainNoteLayoutProps {
  children: ReactNode;
  onSearchClick?: () => void;
  onInboxClick?: () => void;
}

export function SupBrainNoteLayout({
  children,
  onSearchClick,
  onInboxClick,
}: SupBrainNoteLayoutProps) {
  const navigate = useNavigate();
  const { data: inboxNotes } = useNotes({ inbox: true });
  const inboxCount = Array.isArray(inboxNotes) ? inboxNotes.length : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Mínimo */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/supbrainnote")}
              className="text-xl font-bold hover:opacity-80 transition-opacity"
            >
              SupBrainNote
            </button>
          </div>

          {/* Ações do Header */}
          <div className="flex items-center gap-2">
            {/* Badge Inbox */}
            {inboxCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="relative"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // #region agent log
                  fetch('http://127.0.0.1:7243/ingest/8a2091d5-0f0b-4303-b859-a6756e62cd84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SupBrainNoteLayout.tsx:48',message:'Botão inbox clicado',data:{hasOnInboxClick:!!onInboxClick},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                  // #endregion
                  console.log("Botão inbox do header clicado, onInboxClick:", onInboxClick);
                  if (onInboxClick) {
                    try {
                      // #region agent log
                      fetch('http://127.0.0.1:7243/ingest/8a2091d5-0f0b-4303-b859-a6756e62cd84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SupBrainNoteLayout.tsx:53',message:'Chamando onInboxClick',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                      // #endregion
                      onInboxClick();
                      // #region agent log
                      fetch('http://127.0.0.1:7243/ingest/8a2091d5-0f0b-4303-b859-a6756e62cd84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SupBrainNoteLayout.tsx:56',message:'onInboxClick executado com sucesso',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                      // #endregion
                    } catch (error) {
                      // #region agent log
                      fetch('http://127.0.0.1:7243/ingest/8a2091d5-0f0b-4303-b859-a6756e62cd84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SupBrainNoteLayout.tsx:59',message:'Erro ao executar onInboxClick',data:{errorMessage:error instanceof Error?error.message:String(error),errorStack:error instanceof Error?error.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                      // #endregion
                      throw error;
                    }
                  } else {
                    console.warn("onInboxClick não está definido!");
                  }
                }}
              >
                <Inbox className="w-4 h-4" />
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {inboxCount > 9 ? "9+" : inboxCount}
                </Badge>
              </Button>
            )}

            {/* Busca - Abre modal de consulta */}
            <Button variant="ghost" size="sm" onClick={onSearchClick}>
              <Search className="w-4 h-4" />
            </Button>

            {/* Configurações */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Botão de configurações clicado");
                // TODO: Implementar modal de configurações
                // Por enquanto, apenas log para evitar erro
              }}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col">
        <div className="container mx-auto max-w-7xl w-full px-4">
          {children}
        </div>
      </main>
    </div>
  );
}


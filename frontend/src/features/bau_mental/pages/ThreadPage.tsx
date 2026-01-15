/** Página de thread (chat com histórico). */

import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useRef } from "react";
import { ThreadView } from "../components/ThreadView";
import {
  useCreateThread,
  useThreads,
} from "../hooks/use-thread";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export function ThreadPage() {
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const boxId = searchParams.get("box") || null;
  const query = searchParams.get("query");
  const createThreadMutation = useCreateThread();
  const isCreatingRef = useRef(false);
  
  // Buscar threads (desabilitar retry automático em caso de erro)
  const { data: threads } = useThreads(
    boxId ? { box: boxId } : { global: true }
  );

  // Se há query na URL mas não há thread, criar nova thread
  useEffect(() => {
    if (query && !id && !isCreatingRef.current) {
      isCreatingRef.current = true;
      const createThread = async () => {
        try {
          const data: any = {};
          if (boxId) {
            data.box_id = boxId;
          } else {
            data.is_global = true;
          }
          data.title = query.substring(0, 50); // Título inicial da query

          const newThread = await createThreadMutation.mutateAsync(data);
          // Adicionar mensagem inicial com a query
          // Isso será feito automaticamente quando o usuário enviar
          navigate(`/bau-mental/thread/${newThread.id}?query=${encodeURIComponent(query)}`, { replace: true });
        } catch (error: any) {
          console.error("Erro ao criar thread:", error);
          const errorMessage = error?.response?.data?.error || error?.response?.data?.detail || error?.message;
          toast({
            title: "Erro ao criar thread",
            description: errorMessage || "Não foi possível criar a thread. Verifique se está autenticado e se o workspace está configurado corretamente.",
            variant: "destructive",
          });
          // Limpar query da URL em caso de erro
          navigate("/bau-mental/thread", { replace: true });
        } finally {
          isCreatingRef.current = false;
        }
      };
      createThread();
    }
  }, [query, id, boxId, navigate]);

  return (
    <div className="h-full">
      <ThreadView boxId={boxId} />
    </div>
  );
}

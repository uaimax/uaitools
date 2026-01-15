/** Header da caixinha com nome, cor, contador e ações. */

import { MessageSquare, Sparkles, History, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Box } from "../hooks/use-boxes";
import { useNavigate } from "react-router-dom";
import { FileAndTextModal } from "./FileAndTextModal";
import { SummaryGenerator } from "./SummaryGenerator";
import { useThreads } from "../hooks/use-thread";
import { useState } from "react";

interface BoxHeaderProps {
  box: Box;
}

export function BoxHeader({ box }: BoxHeaderProps) {
  const navigate = useNavigate();
  const [showSummary, setShowSummary] = useState(false);
  const [showFileAndTextModal, setShowFileAndTextModal] = useState(false);
  const { data: threads } = useThreads({ box: box.id });
  const threadsCount = Array.isArray(threads) ? threads.length : 0;

  return (
    <div className="border-b bg-card/50 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: box.color || "#6366F1" }}
          />
          <div>
            <h1 className="text-2xl font-semibold">{box.name}</h1>
            <p className="text-sm text-muted-foreground">
              {box.note_count} {box.note_count === 1 ? "nota" : "notas"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/bau-mental/thread?box=${box.id}`)}
          >
            <History className="w-4 h-4 mr-2" />
            Histórico
            {threadsCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {threadsCount}
              </Badge>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSummary(!showSummary)}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Resumo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/bau-mental/thread?box=${box.id}`)}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Conversar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFileAndTextModal(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Adicionar arquivos
          </Button>
        </div>
      </div>

      {showSummary && (
        <SummaryGenerator boxId={box.id} />
      )}

      <FileAndTextModal
        open={showFileAndTextModal}
        onOpenChange={setShowFileAndTextModal}
        initialBoxId={box.id}
      />
    </div>
  );
}

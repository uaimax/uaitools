/** Página principal do Baú Mental - Interface single-purpose. */

import { useState } from "react";
import { BauMentalLayout } from "../components/layout/BauMentalLayout";
import { RecordingButton } from "../components/RecordingButton";
import { BoxListCompact } from "../components/BoxListCompact";
import { NotesView } from "../components/NotesView";
import { QueryModal } from "../components/QueryModal";
import { useCreateBox, useBoxes } from "../hooks/use-boxes";
import { useUploadAudio } from "../hooks/use-notes";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function BauMentalPage() {
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [showCreateBox, setShowCreateBox] = useState(false);
  const [showNotesView, setShowNotesView] = useState(false);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [newBoxName, setNewBoxName] = useState("");


  const createBoxMutation = useCreateBox();
  const uploadMutation = useUploadAudio();
  const { data: boxes } = useBoxes();
  const boxesArray = Array.isArray(boxes) ? boxes : [];
  const selectedBox = boxesArray.find((b) => b.id === selectedBoxId);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/8a2091d5-0f0b-4303-b859-a6756e62cd84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BauMentalPage.tsx:58',message:'handleFileUpload chamado',data:{file_name:file.name,file_size:file.size,selected_box_id:selectedBoxId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
    // #endregion

    try {
      await uploadMutation.mutateAsync({
        audio_file: file,
        box_id: selectedBoxId ? selectedBoxId : undefined, // Garante que null vira undefined
        source_type: "group_audio",
      });
      toast({
        title: "Sucesso",
        description: "Áudio enviado com sucesso! Processando...",
      });
      setShowUploadDialog(false);
      // Limpar input para permitir upload do mesmo arquivo novamente
      e.target.value = "";
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/8a2091d5-0f0b-4303-b859-a6756e62cd84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BauMentalPage.tsx:75',message:'Erro no handleFileUpload',data:{error_status:error?.response?.status,error_message:error?.response?.data?.detail||error?.message,is_429:error?.response?.status===429},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
      // #endregion

      // Tratar erro 429 (rate limit) especificamente
      if (error?.response?.status === 429) {
        const retryAfter = error?.response?.data?.detail?.match(/(\d+)\s+segundos?/i)?.[1] || "alguns";
        const minutes = Math.ceil(parseInt(retryAfter) / 60);
        toast({
          title: "Limite de uploads atingido",
          description: `Você atingiu o limite de uploads. Tente novamente em ${minutes} minuto${minutes > 1 ? 's' : ''}.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: error?.response?.data?.detail || "Não foi possível enviar o áudio.",
          variant: "destructive",
        });
      }
      // Limpar input mesmo em caso de erro
      e.target.value = "";
    }
  };

  const handleBoxClick = (boxId: string | null) => {
    try {
      console.log("handleBoxClick chamado com boxId:", boxId);
      setSelectedBoxId(boxId);
      console.log("Abrindo modal de anotações...");
      setShowNotesView(true);
      console.log("Modal aberto");
    } catch (error) {
      console.error("Erro ao abrir caixinha:", error);
      toast({
        title: "Erro",
        description: "Não foi possível abrir a caixinha.",
        variant: "destructive",
      });
    }
  };

  return (
      <BauMentalLayout
      onSearchClick={() => setShowQueryModal(true)}
      onInboxClick={() => {
        try {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/8a2091d5-0f0b-4303-b859-a6756e62cd84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BauMentalPage.tsx:102',message:'onInboxClick handler iniciado',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          console.log("onInboxClick chamado do header");
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/8a2091d5-0f0b-4303-b859-a6756e62cd84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BauMentalPage.tsx:105',message:'Antes de setSelectedBoxId(null)',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          setSelectedBoxId(null);
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/8a2091d5-0f0b-4303-b859-a6756e62cd84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BauMentalPage.tsx:107',message:'Antes de setShowNotesView(true)',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          console.log("selectedBoxId definido como null");
          setShowNotesView(true);
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/8a2091d5-0f0b-4303-b859-a6756e62cd84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BauMentalPage.tsx:110',message:'setShowNotesView(true) executado',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          console.log("showNotesView definido como true");
        } catch (error) {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/8a2091d5-0f0b-4303-b859-a6756e62cd84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BauMentalPage.tsx:112',message:'Erro capturado no handler',data:{errorMessage:error instanceof Error?error.message:String(error),errorStack:error instanceof Error?error.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          console.error("Erro ao abrir inbox do header:", error);
          toast({
            title: "Erro",
            description: "Não foi possível abrir o inbox.",
            variant: "destructive",
          });
        }
      }}
    >
      <SEO
        title="Baú Mental"
        description="Grave, jogue, esqueça. Quando precisar, pergunte."
        keywords="anotações, áudio, transcrição, IA"
        noindex={true}
      />

      <div className="flex-1 flex flex-col w-full">
        {/* Área Principal - Botão de Gravar Gigante */}
        <div className="flex-1 flex items-center justify-center w-full">
          <RecordingButton
            boxId={selectedBoxId || undefined}
            onRecordingComplete={() => {
              // Recarregar dados após gravação
              setSelectedBoxId(null);
            }}
          />
        </div>

        {/* Aviso de retenção de 7 dias */}
        <div className="mt-4 px-4">
          <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-3">
            <span className="font-medium">ℹ️ Retenção de áudio:</span> Os áudios são mantidos por 7 dias para otimizar o armazenamento. Após esse período, os arquivos são removidos automaticamente.
          </div>
        </div>

        {/* Seção Inferior - Caixinhas e Upload */}
        <div className="mt-auto border-t bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
          {/* Caixinhas */}
          <div className="py-4">
            <BoxListCompact
              selectedBoxId={showNotesView ? selectedBoxId : undefined}
              onSelectBox={handleBoxClick}
              onCreateBox={() => setShowCreateBox(true)}
            />
          </div>

          {/* Ação Secundária - Upload de arquivo */}
          <div className="border-t border-border/50 px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUploadDialog(true)}
              className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent/50"
            >
              <Upload className="w-4 h-4 mr-2" />
              Enviar arquivo de áudio
            </Button>
          </div>
        </div>
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

      {/* Modal: Visualizar Anotações */}
      <NotesView
        boxId={selectedBoxId}
        boxName={selectedBox?.name}
        open={showNotesView}
        onOpenChange={setShowNotesView}
        onSummarize={() => {
          // TODO: Implementar resumo com IA
          toast({
            title: "Em breve",
            description: "Funcionalidade de resumo com IA será implementada em breve.",
          });
        }}
      />

      {/* Modal: Consulta com IA */}
      <QueryModal open={showQueryModal} onOpenChange={setShowQueryModal} />

      {/* Dialog: Upload de Arquivo */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar áudio de arquivo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="audio-file">Selecione o arquivo de áudio</Label>
            <Input
              id="audio-file"
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              disabled={uploadMutation.isPending}
            />
            <p className="text-sm text-muted-foreground">
              Formatos suportados: .m4a, .mp3, .wav, .ogg
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </BauMentalLayout>
  );
}

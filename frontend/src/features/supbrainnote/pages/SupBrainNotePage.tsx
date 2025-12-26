/** Página principal do SupBrainNote. */

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AudioRecorder } from "../components/AudioRecorder";
import { BoxList } from "../components/BoxList";
import { NoteList } from "../components/NoteList";
import { QueryInterface } from "../components/QueryInterface";
import { useCreateBox } from "../hooks/use-boxes";
import { useUploadAudio } from "../hooks/use-notes";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Upload } from "lucide-react";

export default function SupBrainNotePage() {
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [showCreateBox, setShowCreateBox] = useState(false);
  const [newBoxName, setNewBoxName] = useState("");
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const createBoxMutation = useCreateBox();
  const uploadMutation = useUploadAudio();

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

    try {
      await uploadMutation.mutateAsync({
        audio_file: file,
        box_id: selectedBoxId || undefined,
        source_type: "group_audio",
      });
      toast({
        title: "Sucesso",
        description: "Áudio enviado com sucesso! Processando...",
      });
      setShowUploadDialog(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar o áudio.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SupBrainNote</h1>
          <p className="text-muted-foreground mt-1">
            Grave, jogue, esqueça. Quando precisar, pergunte.
          </p>
        </div>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Enviar áudio
            </Button>
          </DialogTrigger>
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
      </div>

      {/* Caixinhas */}
      <BoxList
        selectedBoxId={selectedBoxId}
        onSelectBox={setSelectedBoxId}
        onCreateBox={() => setShowCreateBox(true)}
      />

      {/* Tabs */}
      <Tabs defaultValue="record" className="space-y-4">
        <TabsList>
          <TabsTrigger value="record">Gravar</TabsTrigger>
          <TabsTrigger value="notes">Anotações</TabsTrigger>
          <TabsTrigger value="query">Perguntar</TabsTrigger>
        </TabsList>

        <TabsContent value="record" className="space-y-4">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Gravar novo áudio</h2>
            <AudioRecorder boxId={selectedBoxId || undefined} />
          </div>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <NoteList boxId={selectedBoxId} />
        </TabsContent>

        <TabsContent value="query" className="space-y-4">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Consultar anotações</h2>
            <QueryInterface />
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog criar caixinha */}
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
              <Button
                variant="outline"
                onClick={() => setShowCreateBox(false)}
              >
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
    </div>
  );
}


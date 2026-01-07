/** Componente para gravação de áudio no navegador. */

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploadAudio } from "../hooks/use-notes";
import { toast } from "@/hooks/use-toast";

interface AudioRecorderProps {
  onRecordingComplete?: (audioBlob: Blob) => void;
  boxId?: string;
}

export function AudioRecorder({ onRecordingComplete, boxId }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const uploadMutation = useUploadAudio();

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Parar todas as tracks
        stream.getTracks().forEach((track) => track.stop());

        if (onRecordingComplete) {
          onRecordingComplete(blob);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error("Erro ao iniciar gravação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível acessar o microfone. Verifique as permissões.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleUpload = async () => {
    if (!audioBlob) return;

    try {
      // Converter blob para File
      const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, {
        type: "audio/webm",
      });

      await uploadMutation.mutateAsync({
        audio_file: audioFile,
        box_id: boxId,
        source_type: "memo",
      });

      toast({
        title: "Sucesso",
        description: "Áudio enviado com sucesso! Processando...",
      });

      // Limpar estado
      setAudioBlob(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
    } catch (error) {
      console.error("Erro ao enviar áudio:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o áudio. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      {!audioBlob ? (
        <>
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? "bg-red-500 hover:bg-red-600 animate-pulse"
                : "bg-primary hover:bg-primary/90"
            }`}
          >
            {isRecording ? (
              <Square className="w-12 h-12 text-white" />
            ) : (
              <Mic className="w-12 h-12 text-white" />
            )}
          </button>

          {isRecording && (
            <div className="text-center">
              <div className="text-2xl font-mono">{formatTime(recordingTime)}</div>
              <div className="text-sm text-muted-foreground mt-1">
                Solte para parar
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <audio src={audioUrl || undefined} controls className="w-full max-w-md" />
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setAudioBlob(null);
                if (audioUrl) {
                  URL.revokeObjectURL(audioUrl);
                  setAudioUrl(null);
                }
              }}
              variant="outline"
            >
              Descartar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploadMutation.isPending}
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploadMutation.isPending ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}




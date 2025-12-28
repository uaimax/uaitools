/** Botão gigante de gravação - Ação principal do app. */

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { useUploadAudio } from "../hooks/use-notes";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface RecordingButtonProps {
  boxId?: string;
  onRecordingComplete?: () => void;
}

export function RecordingButton({ boxId, onRecordingComplete }: RecordingButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const uploadMutation = useUploadAudio();

  // Timer de gravação
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
      streamRef.current = stream;
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
        // Parar todas as tracks
        stream.getTracks().forEach((track) => track.stop());
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
    if (!audioBlob || isUploading) return; // Prevenir múltiplos uploads simultâneos

    setIsUploading(true);
    try {
      const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, {
        type: "audio/webm",
      });

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/8a2091d5-0f0b-4303-b859-a6756e62cd84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RecordingButton.tsx:90',message:'handleUpload chamado',data:{audio_blob_size:audioBlob.size,box_id:boxId,is_uploading:isUploading},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
      // #endregion

      await uploadMutation.mutateAsync({
        audio_file: audioFile,
        box_id: boxId || undefined, // Garante que undefined não vira string vazia
        source_type: "memo",
      });

      toast({
        title: "Entendi!",
        description: "Processando sua anotação...",
      });

      // Limpar estado
      setAudioBlob(null);
      setRecordingTime(0);
      onRecordingComplete?.();
    } catch (error: any) {
      console.error("Erro ao enviar áudio:", error);

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/8a2091d5-0f0b-4303-b859-a6756e62cd84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RecordingButton.tsx:115',message:'Erro capturado no handleUpload',data:{error_status:error?.response?.status,error_message:error?.response?.data?.detail||error?.message,is_429:error?.response?.status===429},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
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
          description: error?.response?.data?.detail || "Não foi possível enviar o áudio. Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Se está gravando, mostrar botão de parar
  if (isRecording) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12">
        <button
          onMouseUp={stopRecording}
          onTouchEnd={stopRecording}
          className={cn(
            "w-48 h-48 sm:w-64 sm:h-64 rounded-full flex items-center justify-center",
            "bg-red-500 hover:bg-red-600 active:bg-red-700",
            "transition-all shadow-lg shadow-red-500/50",
            "animate-pulse"
          )}
        >
          <Square className="w-16 h-16 sm:w-20 sm:h-20 text-white" />
        </button>
        <div className="text-center">
          <div className="text-4xl font-mono font-bold">{formatTime(recordingTime)}</div>
          <div className="text-sm text-muted-foreground mt-2">Solte para parar</div>
        </div>
      </div>
    );
  }

  // Se tem áudio gravado, mostrar opções
  if (audioBlob) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12">
        <div className="text-center space-y-4">
          <div className="text-lg font-medium">Áudio gravado!</div>
          <div className="flex flex-col gap-3 items-center">
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="px-6 py-3 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                    Enviando...
                  </>
                ) : (
                  "Enviar"
                )}
              </button>
            </div>
            <button
              onClick={() => {
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/8a2091d5-0f0b-4303-b859-a6756e62cd84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RecordingButton.tsx:181',message:'Descartar e gravar novo clicado',data:{audio_blob_size:audioBlob.size,is_uploading:isUploading},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
                // #endregion
                setAudioBlob(null);
                setRecordingTime(0);
                // Iniciar nova gravação automaticamente
                startRecording();
              }}
              disabled={isUploading}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Descartar e gravar novo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Estado inicial: botão gigante de gravar
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12" style={{ minHeight: "40vh" }}>
      <button
        onMouseDown={startRecording}
        onTouchStart={startRecording}
        className={cn(
          "w-48 h-48 sm:w-64 sm:h-64 rounded-full flex items-center justify-center",
          "bg-primary hover:bg-primary/90 active:bg-primary/80",
          "transition-all shadow-lg shadow-primary/50",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        )}
        aria-label="Gravar áudio"
      >
        <Mic className="w-16 h-16 sm:w-20 sm:h-20 text-primary-foreground" />
      </button>
      <p className="text-muted-foreground text-center text-sm sm:text-base max-w-md">
        Grave, jogue, esqueça. Quando precisar, pergunte.
      </p>
    </div>
  );
}


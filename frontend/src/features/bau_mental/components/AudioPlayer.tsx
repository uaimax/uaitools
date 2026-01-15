/** Player de áudio inline. */

import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  audioUrl: string;
  className?: string;
}

export function AudioPlayer({ audioUrl, className }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Converter URL relativa para absoluta se necessário
  const getAbsoluteUrl = (url: string): string => {
    if (!url) return url;
    // Se já é URL absoluta, retornar como está
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    // Se é relativa, adicionar base URL do backend
    // VITE_API_URL geralmente é "http://localhost:8001/api" ou "http://localhost:8001/api/v1"
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8001/api/v1";
    // Extrair apenas a base (http://localhost:8001)
    let baseUrl = apiUrl;
    // Remover /api/v1, /api, /v1 do final
    baseUrl = baseUrl.replace(/\/api\/v1\/?$/, "").replace(/\/api\/?$/, "").replace(/\/v1\/?$/, "");
    // Se não tem protocolo, adicionar http://localhost:8001 como padrão
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      baseUrl = "http://localhost:8001";
    }
    // Remover barra dupla se houver e construir URL final
    const cleanUrl = url.startsWith("/") ? url : `/${url}`;
    return `${baseUrl}${cleanUrl}`;
  };

  const absoluteAudioUrl = getAbsoluteUrl(audioUrl);

  useEffect(() => {
    if (!absoluteAudioUrl) {
      setError("URL do áudio não disponível");
      return;
    }

    const audio = new Audio(absoluteAudioUrl);
    audioRef.current = audio;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    const handleError = (e: Event) => {
      const audioError = audio.error;
      let errorMessage = "Erro ao carregar áudio";

      if (audioError) {
        switch (audioError.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = "Carregamento do áudio foi cancelado";
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = "Erro de rede ao carregar áudio";
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = "Erro ao decodificar áudio";
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = "Formato de áudio não suportado";
            break;
          default:
            errorMessage = `Erro ao carregar áudio (código: ${audioError.code})`;
        }
      }

      console.error("Erro ao carregar áudio:", e);
      console.error("URL do áudio (original):", audioUrl);
      console.error("URL do áudio (absoluta):", absoluteAudioUrl);
      console.error("Detalhes do erro:", audioError);
      setError(errorMessage);
      setIsPlaying(false);
    };
    const handleCanPlay = () => {
      console.log("Áudio pronto para tocar:", absoluteAudioUrl);
      setError(null);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.pause();
      audio.src = "";
    };
  }, [absoluteAudioUrl, audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (error) {
    return (
      <div className={cn("flex items-center gap-3 text-sm text-destructive", className)}>
        <span>⚠️ {error}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setError(null);
            // Tentar recarregar
            if (audioRef.current) {
              audioRef.current.load();
            }
          }}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Button
        variant="outline"
        size="icon"
        onClick={togglePlay}
        className="flex-shrink-0"
        disabled={!absoluteAudioUrl}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </Button>

      <div className="flex-1 space-y-1">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${progress}%, hsl(var(--secondary)) ${progress}%, hsl(var(--secondary)) 100%)`,
          }}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}



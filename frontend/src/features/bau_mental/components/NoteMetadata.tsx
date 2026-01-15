/** Metadata da nota. */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, File, CheckCircle, XCircle, Loader2 } from "lucide-react";
import type { Note } from "../hooks/use-notes";

interface NoteMetadataProps {
  note: Note;
}

export function NoteMetadata({ note }: NoteMetadataProps) {
  const getStatusIcon = () => {
    switch (note.processing_status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "processing":
      case "pending":
        return <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Metadata</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Duração
          </span>
          <span>
            {note.duration_seconds
              ? `${Math.round(note.duration_seconds)}s`
              : "N/A"}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-2">
            <File className="w-4 h-4" />
            Tamanho
          </span>
          <span>{formatFileSize(note.file_size_bytes)}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Status</span>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="capitalize">
              {note.processing_status || "N/A"}
            </span>
          </div>
        </div>

        {note.source_type && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Origem</span>
            <span className="capitalize">{note.source_type}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

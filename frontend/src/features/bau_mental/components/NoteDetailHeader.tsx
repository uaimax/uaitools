/** Header da página de nota individual. */

import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Note } from "../hooks/use-notes";
import { NoteActions } from "./NoteActions";

interface NoteDetailHeaderProps {
  note: Note;
}

export function NoteDetailHeader({ note }: NoteDetailHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          {note.box_name && (
            <Badge variant="outline" className="mb-2">
              {note.box_name}
            </Badge>
          )}
          {!note.box_name && (
            <Badge variant="secondary" className="mb-2">
              Inbox
            </Badge>
          )}
          <p className="text-sm text-muted-foreground">
            {note.created_at
              ? new Date(note.created_at).toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </p>
        </div>
      </div>

      <NoteActions note={note} />
    </div>
  );
}

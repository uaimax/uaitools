/** Modal de configurações básico. */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth-store";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { user } = useAuthStore();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informações do usuário */}
          <div className="space-y-2">
            <Label>Usuário</Label>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{user?.email}</p>
              {user?.workspace && (
                <p className="text-sm text-muted-foreground mt-1">
                  Workspace: {user.workspace.name}
                </p>
              )}
            </div>
          </div>

          {/* Workspace ID (debug) */}
          {process.env.NODE_ENV === "development" && (
            <div className="space-y-2">
              <Label>Workspace ID (Debug)</Label>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-mono">
                  {localStorage.getItem("workspace_id") || "Não definido"}
                </p>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

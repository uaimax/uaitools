/** Modal para compartilhar caixinha com outros usuários. */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBoxShares, useShareBox, useUpdateSharePermission, useRemoveShare } from "../hooks/use-box-share";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Eye, Edit, Trash2, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface BoxShareModalProps {
  boxId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BoxShareModal({ boxId, open, onOpenChange }: BoxShareModalProps) {
  const { data: shares, isLoading } = useBoxShares(boxId);
  const shareMutation = useShareBox();
  const updatePermissionMutation = useUpdateSharePermission();
  const removeShareMutation = useRemoveShare();

  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"read" | "write">("read");
  const [isAdding, setIsAdding] = useState(false);

  const sharesArray = Array.isArray(shares) ? shares : [];

  const handleShare = async () => {
    if (!boxId || !email.trim()) {
      toast({
        title: "Erro",
        description: "Email é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    try {
      await shareMutation.mutateAsync({
        boxId,
        email: email.trim(),
        permission,
      });
      toast({
        title: "Sucesso",
        description: "Convite enviado com sucesso!",
      });
      setEmail("");
      setPermission("read");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.response?.data?.error || "Não foi possível compartilhar a caixinha.",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdatePermission = async (shareId: string, newPermission: "read" | "write") => {
    if (!boxId) return;

    try {
      await updatePermissionMutation.mutateAsync({
        boxId,
        shareId,
        permission: newPermission,
      });
      toast({
        title: "Sucesso",
        description: "Permissão atualizada com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a permissão.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    if (!boxId) return;

    try {
      await removeShareMutation.mutateAsync({ boxId, shareId });
      toast({
        title: "Sucesso",
        description: "Compartilhamento removido com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o compartilhamento.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compartilhar caixinha</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulário para adicionar compartilhamento */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              <h3 className="font-semibold">Adicionar pessoa</h3>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="share-email">Email</Label>
                <Input
                  id="share-email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleShare();
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="share-permission">Permissão</Label>
                <Select
                  value={permission}
                  onValueChange={(value) => setPermission(value as "read" | "write")}
                >
                  <SelectTrigger id="share-permission">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        <span>Leitura</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="write">
                      <div className="flex items-center gap-2">
                        <Edit className="w-4 h-4" />
                        <span>Leitura e Escrita</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleShare}
                disabled={!email.trim() || isAdding || shareMutation.isPending}
                className="w-full"
              >
                {isAdding || shareMutation.isPending ? "Compartilhando..." : "Compartilhar"}
              </Button>
            </div>
          </div>

          {/* Lista de compartilhamentos */}
          <div className="space-y-2">
            <h3 className="font-semibold">Pessoas com acesso</h3>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : sharesArray.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Nenhuma pessoa compartilhada ainda.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {sharesArray.map((share) => (
                  <Card key={share.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{share.shared_with_email}</div>
                            <div className="text-sm text-muted-foreground">
                              {share.status === "pending" ? "Convite pendente" : "Acesso ativo"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={share.permission}
                            onValueChange={(value) =>
                              handleUpdatePermission(share.id, value as "read" | "write")
                            }
                            disabled={updatePermissionMutation.isPending}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="read">
                                <div className="flex items-center gap-2">
                                  <Eye className="w-4 h-4" />
                                  <span>Leitura</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="write">
                                <div className="flex items-center gap-2">
                                  <Edit className="w-4 h-4" />
                                  <span>Leitura e Escrita</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover compartilhamento?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {share.shared_with_email} perderá o acesso a esta caixinha.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveShare(share.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


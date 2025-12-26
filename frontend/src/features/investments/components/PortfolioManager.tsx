/** Componente para gerenciar múltiplas carteiras. */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectItem } from "@/components/ui/select";
import { usePortfolios, useCreatePortfolio, useUpdatePortfolio, useDeletePortfolio } from "../hooks/use-investments";
import { useToast } from "@/stores/toast-store";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function PortfolioManager({
  selectedPortfolioId,
  onPortfolioChange
}: {
  selectedPortfolioId: string | null;
  onPortfolioChange: (id: string) => void;
}) {
  const { t } = useTranslation(["investments", "common"]);
  const { toast } = useToast();
  const { data: portfolios = [], isLoading } = usePortfolios();
  const createPortfolio = useCreatePortfolio();
  const updatePortfolio = useUpdatePortfolio();
  const deletePortfolio = useDeletePortfolio();

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [renamePortfolioName, setRenamePortfolioName] = useState("");

  const selectedPortfolio = portfolios.find(p => p.id === selectedPortfolioId);

  const handleCreate = async () => {
    if (!newPortfolioName.trim()) {
      toast({
        title: t("common:errors.error"),
        description: "Nome da carteira é obrigatório",
        variant: "destructive",
      });
      return;
    }

    try {
      const newPortfolio = await createPortfolio.mutateAsync({
        portfolio_type: "acoes_br",
        name: newPortfolioName.trim(),
      });
      setShowNewDialog(false);
      setNewPortfolioName("");
      onPortfolioChange(newPortfolio.id);
      toast({
        title: t("common:messages.success"),
        description: t("investments:toasts.create_success"),
      });
    } catch (error: any) {
      toast({
        title: t("common:errors.error"),
        description: error.message || t("investments:toasts.create_error"),
        variant: "destructive",
      });
    }
  };

  const handleRename = async () => {
    if (!selectedPortfolio || !renamePortfolioName.trim()) {
      return;
    }

    try {
      await updatePortfolio.mutateAsync({
        id: selectedPortfolio.id,
        data: { name: renamePortfolioName.trim() },
      });
      setShowRenameDialog(false);
      setRenamePortfolioName("");
      toast({
        title: t("common:messages.success"),
        description: t("investments:toasts.update_success"),
      });
    } catch (error: any) {
      toast({
        title: t("common:errors.error"),
        description: error.message || t("investments:toasts.update_error"),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedPortfolio) return;

    if (!confirm(t("investments:portfolios.confirm_delete"))) {
      return;
    }

    try {
      await deletePortfolio.mutateAsync(selectedPortfolio.id);
      toast({
        title: t("common:messages.success"),
        description: t("investments:toasts.delete_success"),
      });
      // Selecionar primeira carteira disponível ou redirecionar
      const remaining = portfolios.filter(p => p.id !== selectedPortfolio.id);
      if (remaining.length > 0) {
        onPortfolioChange(remaining[0].id);
      } else {
        // Redirecionar para onboarding se não houver carteiras
        window.location.href = "/investments/onboarding";
      }
    } catch (error: any) {
      toast({
        title: t("common:errors.error"),
        description: error.message || t("investments:toasts.delete_error"),
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("investments:portfolios.manage")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t("common:messages.loading")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("investments:portfolios.manage")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("investments:portfolios.active_portfolio")}</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                value={selectedPortfolioId || ""}
                onChange={onPortfolioChange}
                placeholder={t("investments:portfolios.select_portfolio")}
                className="flex-1"
              >
                {portfolios.map((portfolio) => (
                  <SelectItem key={portfolio.id} value={portfolio.id}>
                    {portfolio.name || t("investments:portfolios.default_name")}
                  </SelectItem>
                ))}
              </Select>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setShowNewDialog(true);
                  }}
                  className="flex-1 sm:flex-initial"
                >
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t("investments:portfolios.new")}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedPortfolio) {
                      setRenamePortfolioName(selectedPortfolio.name || "");
                      setShowRenameDialog(true);
                    }
                  }}
                  disabled={!selectedPortfolio}
                  className="flex-1 sm:flex-initial"
                >
                  <Pencil className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t("investments:portfolios.rename")}</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={!selectedPortfolio || portfolios.length <= 1}
                  className="flex-1 sm:flex-initial"
                >
                  <Trash2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t("investments:portfolios.delete")}</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Nova Carteira */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("investments:portfolios.new")}</DialogTitle>
            <DialogDescription>
              {t("investments:portfolios.new_description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">{t("investments:portfolios.name")}</Label>
              <Input
                id="new-name"
                value={newPortfolioName}
                onChange={(e) => setNewPortfolioName(e.target.value)}
                placeholder={t("investments:portfolios.name_placeholder")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreate();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              {t("common:actions.cancel")}
            </Button>
            <Button onClick={handleCreate} disabled={createPortfolio.isPending}>
              {createPortfolio.isPending ? t("common:messages.loading") : t("common:actions.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Renomear */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("investments:portfolios.rename")}</DialogTitle>
            <DialogDescription>
              {t("investments:portfolios.rename_description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rename-name">{t("investments:portfolios.name")}</Label>
              <Input
                id="rename-name"
                value={renamePortfolioName}
                onChange={(e) => setRenamePortfolioName(e.target.value)}
                placeholder={t("investments:portfolios.name_placeholder")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRename();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              {t("common:actions.cancel")}
            </Button>
            <Button onClick={handleRename} disabled={updatePortfolio.isPending}>
              {updatePortfolio.isPending ? t("common:messages.loading") : t("common:actions.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


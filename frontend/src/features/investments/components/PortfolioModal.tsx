/** Modal para criar ou editar carteira. */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreatePortfolio, useUpdatePortfolio, type Portfolio } from "../hooks/use-investments";
import { Loader2 } from "lucide-react";

interface PortfolioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolio?: Portfolio | null;
  onSuccess?: () => void;
}

export function PortfolioModal({ open, onOpenChange, portfolio, onSuccess }: PortfolioModalProps) {
  const [name, setName] = useState(portfolio?.name || "");
  const [portfolioType, setPortfolioType] = useState<"acoes_br">(portfolio?.portfolio_type || "acoes_br");

  const createMutation = useCreatePortfolio();
  const updateMutation = useUpdatePortfolio();

  const isEditing = !!portfolio;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name: name.trim() || undefined,
      portfolio_type: portfolioType,
    };

    try {
      if (isEditing && portfolio) {
        await updateMutation.mutateAsync({ id: portfolio.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }

      setName("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao salvar carteira:", error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isLoading) {
      setName(portfolio?.name || "");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Carteira" : "Criar Nova Carteira"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações da sua carteira de investimentos."
              : "Crie uma nova carteira para organizar seus investimentos."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Carteira</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Carteira Principal, Ações Longo Prazo..."
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco para usar o nome padrão baseado no tipo.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="portfolio_type">Tipo de Carteira</Label>
            <select
              id="portfolio_type"
              value={portfolioType}
              onChange={(e) => setPortfolioType(e.target.value as "acoes_br")}
              disabled={isLoading || isEditing}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="acoes_br">Ações Brasileiras</option>
            </select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Salvar" : "Criar Carteira"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


/** Zona 2: Carteira - Lista de ativos com indicadores de performance. */

import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAssets, useDeleteAsset } from "../hooks/use-investments";
import { useToast } from "@/hooks/use-toast";
import { PerformanceIndicator } from "./PerformanceIndicator";

interface PortfolioZoneProps {
  portfolioId: string | null;
  onAddAsset: () => void;
  onEditAsset: (asset: any) => void;
}

export function PortfolioZone({ portfolioId, onAddAsset, onEditAsset }: PortfolioZoneProps) {
  const { data: assets = [], isLoading } = useAssets(
    portfolioId ? { portfolio: portfolioId } : undefined
  );
  const deleteAsset = useDeleteAsset();
  const { toast } = useToast();

  const handleDelete = async (assetId: string) => {
    if (!confirm("Tem certeza que deseja remover este ativo?")) return;

    try {
      await deleteAsset.mutateAsync(assetId);
      toast({
        title: "Ativo removido",
        description: "O ativo foi removido da sua carteira",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o ativo",
        variant: "destructive",
      });
    }
  };

  const totalInvested = assets.reduce((sum, asset) => {
    return sum + parseFloat(asset.quantity) * parseFloat(asset.average_price);
  }, 0);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-muted-foreground text-center py-8">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Sua Carteira</h2>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total investido</p>
            <p className="text-lg font-bold">
              R$ {totalInvested.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>

        {assets.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-muted-foreground">
              Você ainda não tem ativos. Adicione seu primeiro!
            </p>
            <Button onClick={onAddAsset}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar ativo
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {assets.map((asset) => {
              const totalValue =
                parseFloat(asset.quantity) * parseFloat(asset.average_price);
              // Performance simulada - em produção viria da API
              const performanceScore = Math.floor(Math.random() * 5) + 1;

              return (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="font-mono text-base">
                        {asset.ticker}
                      </Badge>
                      <PerformanceIndicator score={performanceScore} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        {parseFloat(asset.quantity).toLocaleString("pt-BR", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}{" "}
                        ações
                      </span>
                      <span>
                        Preço médio: R${" "}
                        {parseFloat(asset.average_price).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-4">
                      <p className="font-semibold">
                        R${" "}
                        {totalValue.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditAsset(asset)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(asset.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={onAddAsset}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar ativo
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


/** Zona 2: Carteira - Tabela de ativos com botões + e - e atualizar preços. */

import { Plus, Minus, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAssets, useDeleteAsset, useUpdateAsset, useUpdatePortfolioPrices } from "../hooks/use-investments";
import { useToast } from "@/hooks/use-toast";
import { PerformanceIndicator } from "./PerformanceIndicator";
import { useState } from "react";

interface PortfolioZoneProps {
  portfolioId: string | null;
  onAddAsset: () => void;
}

export function PortfolioZone({ portfolioId, onAddAsset }: PortfolioZoneProps) {
  const { data: assets = [], isLoading, refetch } = useAssets(
    portfolioId ? { portfolio: portfolioId } : undefined
  );
  const deleteAsset = useDeleteAsset();
  const updateAsset = useUpdateAsset();
  const updatePrices = useUpdatePortfolioPrices();
  const { toast } = useToast();
  const [updatingPrices, setUpdatingPrices] = useState(false);
  const [updatingAsset, setUpdatingAsset] = useState<string | null>(null);

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

  const handleUpdateQuantity = async (asset: any, delta: number) => {
    if (!asset.id) return;

    const currentQuantity = parseFloat(asset.quantity);
    const newQuantity = Math.max(0, currentQuantity + delta);

    if (newQuantity === currentQuantity && delta < 0) {
      toast({
        title: "Aviso",
        description: "Quantidade não pode ser negativa",
        variant: "destructive",
      });
      return;
    }

    setUpdatingAsset(asset.id);

    try {
      await updateAsset.mutateAsync({
        id: asset.id,
        data: {
          quantity: newQuantity.toString(),
          average_price: asset.average_price,
        },
      });

      toast({
        title: "Quantidade atualizada",
        description: `${asset.ticker} agora tem ${newQuantity} ações`,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar a quantidade",
        variant: "destructive",
      });
    } finally {
      setUpdatingAsset(null);
    }
  };

  const handleUpdatePrices = async () => {
    if (!portfolioId) return;

    setUpdatingPrices(true);
    try {
      const result = await updatePrices.mutateAsync(portfolioId);
      toast({
        title: "Preços atualizados",
        description: result.message || `${result.updated_count} ativo(s) atualizado(s)`,
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar os preços",
        variant: "destructive",
      });
    } finally {
      setUpdatingPrices(false);
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
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Sua Carteira</CardTitle>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Valor Consolidado</p>
              <p className="text-lg font-bold text-green-600">
                R$ {totalInvested.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <Button
              onClick={handleUpdatePrices}
              disabled={updatingPrices || !portfolioId}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${updatingPrices ? "animate-spin" : ""}`} />
              Atualizar Preços
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ATIVO</TableHead>
                  <TableHead>QUANTIDADE</TableHead>
                  <TableHead>PREÇO UNIT.</TableHead>
                  <TableHead>TOTAL</TableHead>
                  <TableHead className="text-right">AÇÕES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => {
                  const totalValue =
                    parseFloat(asset.quantity) * parseFloat(asset.average_price);
                  // Performance simulada - em produção viria da API
                  const performanceScore = Math.floor(Math.random() * 5) + 1;
                  const isUpdating = updatingAsset === asset.id;

                  return (
                    <TableRow key={asset.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">
                            {asset.ticker}
                          </Badge>
                          <PerformanceIndicator score={performanceScore} />
                        </div>
                      </TableCell>
                      <TableCell>
                        {parseFloat(asset.quantity).toLocaleString("pt-BR", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        R$ {parseFloat(asset.average_price).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">
                          R$ {totalValue.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleUpdateQuantity(asset, 1)}
                            disabled={isUpdating}
                            title="Aumentar quantidade"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleUpdateQuantity(asset, -1)}
                            disabled={isUpdating || parseFloat(asset.quantity) <= 0}
                            title="Diminuir quantidade"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(asset.id)}
                            disabled={isUpdating}
                            title="Remover ativo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <Button
              variant="outline"
              className="w-full"
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

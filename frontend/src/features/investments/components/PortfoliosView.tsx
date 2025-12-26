/** Visualização da carteira com tabela de ativos. */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, RefreshCw, Trash2, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  usePortfolio,
  useAssets,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
  type Asset,
  investmentsKeys,
} from "../hooks/use-investments";
import { useToast } from "@/stores/toast-store";
import { formatCurrency } from "@/lib/utils";
import { apiClient } from "@/config/api";
import { useQueryClient } from "@tanstack/react-query";

interface PortfoliosViewProps {
  portfolioId: string;
}

export function PortfoliosView({ portfolioId }: PortfoliosViewProps) {
  const { t } = useTranslation(["investments", "common"]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: portfolio, isLoading: loadingPortfolio } = usePortfolio(portfolioId);
  const { data: assets = [], isLoading: loadingAssets } = useAssets({ portfolio: portfolioId });
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();

  const [newTicker, setNewTicker] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newAveragePrice, setNewAveragePrice] = useState("");
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);

  const handleFetchQuote = async () => {
    if (!newTicker.trim()) {
      toast({
        title: t("common:errors.error"),
        description: "Informe o ticker primeiro",
        variant: "destructive",
      });
      return;
    }

    setIsFetchingQuote(true);
    try {
      const tickerUpper = newTicker.trim().toUpperCase();
      const quoteResponse = await apiClient.get(`/investments/quotes/${tickerUpper}/`);
      if (quoteResponse.data?.price && quoteResponse.data.price > 0) {
        setNewAveragePrice(quoteResponse.data.price.toString());
        toast({
          title: t("common:messages.success"),
          description: `Cotação atual: ${formatCurrency(quoteResponse.data.price)}`,
          variant: "default",
        });
      } else {
        throw new Error("Preço inválido retornado");
      }
    } catch (quoteError: any) {
      const errorMsg = quoteError.response?.data?.error || quoteError.message || "Erro desconhecido";
      toast({
        title: t("common:errors.error"),
        description: `Não foi possível buscar cotação: ${errorMsg}`,
        variant: "destructive",
      });
    } finally {
      setIsFetchingQuote(false);
    }
  };

  const handleAddAsset = async () => {
    if (!newTicker.trim() || !newQuantity || parseFloat(newQuantity) <= 0) {
      toast({
        title: t("common:errors.error"),
        description: "Preencha ticker e quantidade",
        variant: "destructive",
      });
      return;
    }

    if (!newAveragePrice || parseFloat(newAveragePrice) < 0.01) {
      toast({
        title: t("common:errors.error"),
        description: "Preço médio deve ser maior ou igual a R$ 0,01",
        variant: "destructive",
      });
      return;
    }

    try {
      await createAsset.mutateAsync({
        portfolio: portfolioId,
        ticker: newTicker.trim().toUpperCase(),
        quantity: newQuantity,
        average_price: newAveragePrice,
      });
      setNewTicker("");
      setNewQuantity("");
      setNewAveragePrice("");
      toast({
        title: t("common:messages.success"),
        description: t("investments:toasts.create_success"),
      });
    } catch (error: any) {
      const errorMessage = error.response?.data
        ? (typeof error.response.data === 'object'
            ? JSON.stringify(error.response.data)
            : String(error.response.data))
        : error.message || t("investments:toasts.create_error");

      toast({
        title: t("common:errors.error"),
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleUpdateQuantity = async (asset: Asset, delta: number) => {
    const currentQty = parseFloat(asset.quantity);
    const newQty = Math.max(0, currentQty + delta);

    if (newQty === 0) {
      // Deletar se quantidade for zero
      try {
        await deleteAsset.mutateAsync(asset.id);
        toast({
          title: t("common:messages.success"),
          description: t("investments:toasts.delete_success"),
        });
      } catch (error: any) {
        toast({
          title: t("common:errors.error"),
          description: error.message || t("investments:toasts.delete_error"),
          variant: "destructive",
        });
      }
    } else {
      // Atualizar quantidade
      try {
        await updateAsset.mutateAsync({
          id: asset.id,
          data: { quantity: newQty.toString() },
        });
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
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm("Tem certeza que deseja deletar este ativo?")) {
      return;
    }

    try {
      await deleteAsset.mutateAsync(assetId);
      toast({
        title: t("common:messages.success"),
        description: t("investments:toasts.delete_success"),
      });
    } catch (error: any) {
      toast({
        title: t("common:errors.error"),
        description: error.message || t("investments:toasts.delete_error"),
        variant: "destructive",
      });
    }
  };

  const handleUpdatePrices = async () => {
    if (!portfolioId) return;

    setIsUpdatingPrices(true);
    try {
      const response = await apiClient.post(`/investments/portfolios/${portfolioId}/update-prices/`);
      const { updated_count, total_assets, errors } = response.data;

      // Invalidar queries para atualizar a lista de ativos
      queryClient.invalidateQueries({ queryKey: investmentsKeys.assets.lists() });
      queryClient.invalidateQueries({ queryKey: investmentsKeys.portfolios.detail(portfolioId) });

      toast({
        title: t("common:messages.success"),
        description: `Preços atualizados: ${updated_count}/${total_assets} ativos${errors && errors.length > 0 ? ` (${errors.length} erros)` : ''}`,
        variant: errors && errors.length > 0 ? "default" : "default",
      });
    } catch (error: any) {
      toast({
        title: t("common:errors.error"),
        description: error.message || "Erro ao atualizar preços",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPrices(false);
    }
  };

  const totalValue = assets.reduce(
    (sum, asset) => sum + parseFloat(asset.quantity) * parseFloat(asset.average_price),
    0
  );

  if (loadingPortfolio || loadingAssets) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-center py-8">{t("common:messages.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        {/* Formulário para adicionar ativo */}
        <div className="space-y-3 p-3 bg-muted rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="flex-1">
              <Label htmlFor="ticker" className="text-xs">{t("investments:fields.ticker")}</Label>
              <Input
                id="ticker"
                placeholder={t("investments:placeholders.ticker")}
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value)}
                onBlur={handleFetchQuote}
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="quantity" className="text-xs">{t("investments:fields.quantity")}</Label>
              <Input
                id="quantity"
                type="number"
                step="0.0001"
                placeholder={t("investments:placeholders.quantity")}
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Label htmlFor="average_price" className="text-xs">{t("investments:fields.average_price")}</Label>
                  <Input
                    id="average_price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder={t("investments:placeholders.average_price")}
                    value={newAveragePrice}
                    onChange={(e) => setNewAveragePrice(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleFetchQuote}
                  disabled={isFetchingQuote || !newTicker.trim()}
                  className="mt-6 h-10 w-10"
                  title="Buscar cotação atual"
                >
                  <RefreshCw className={`h-4 w-4 ${isFetchingQuote ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleAddAsset}
              disabled={createAsset.isPending || !newTicker.trim() || !newQuantity || !newAveragePrice}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              {createAsset.isPending ? t("common:messages.loading") : t("investments:portfolios_view.add_asset")}
            </Button>
          </div>
        </div>

        {/* Tabela de ativos - mobile-first */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 text-xs sm:text-sm font-medium">
                  {t("investments:portfolios_view.table.asset")}
                </th>
                <th className="text-right p-2 text-xs sm:text-sm font-medium">
                  {t("investments:portfolios_view.table.quantity")}
                </th>
                <th className="text-right p-2 text-xs sm:text-sm font-medium hidden sm:table-cell">
                  {t("investments:portfolios_view.table.unit_price")}
                </th>
                <th className="text-right p-2 text-xs sm:text-sm font-medium">
                  {t("investments:portfolios_view.table.total")}
                </th>
                <th className="text-center p-2 text-xs sm:text-sm font-medium">
                  {t("investments:portfolios_view.table.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-muted-foreground">
                    {t("investments:messages.empty")}
                  </td>
                </tr>
              ) : (
                assets.map((asset) => {
                  const qty = parseFloat(asset.quantity);
                  const price = parseFloat(asset.average_price);
                  const total = qty * price;

                  return (
                    <tr key={asset.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <Badge variant="outline" className="text-xs sm:text-sm">
                          {asset.ticker}
                        </Badge>
                      </td>
                      <td className="text-right p-2 text-sm">{qty.toLocaleString("pt-BR")}</td>
                      <td className="text-right p-2 text-sm hidden sm:table-cell">
                        {formatCurrency(price)}
                      </td>
                      <td className="text-right p-2 font-medium">{formatCurrency(total)}</td>
                      <td className="p-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleUpdateQuantity(asset, 1)}
                            title={t("investments:portfolios_view.actions.add")}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleUpdateQuantity(asset, -1)}
                            title={t("investments:portfolios_view.actions.remove")}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleDeleteAsset(asset.id)}
                            title={t("investments:portfolios_view.actions.delete")}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      {/* Resumo e ações */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted rounded-lg">
        <div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t("investments:portfolios_view.consolidated_value")}
          </p>
          <p className="text-lg sm:text-xl font-bold text-primary">
            {formatCurrency(totalValue)}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleUpdatePrices}
          disabled={isUpdatingPrices}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isUpdatingPrices ? 'animate-spin' : ''}`} />
          {isUpdatingPrices ? t("common:messages.loading") : t("investments:portfolios_view.update_prices")}
        </Button>
      </div>
    </div>
  );
}


/** Bloco de visualização da carteira. */

import { useTranslation } from "react-i18next";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Portfolio, Asset } from "../hooks/use-investments";
import { useQuote } from "../hooks/use-investments";

interface PortfolioBlockProps {
  portfolio: Portfolio | undefined;
  assets: Asset[] | undefined;
  loading?: boolean;
  onAddAsset?: () => void;
}

export function PortfolioBlock({ portfolio, assets, loading, onAddAsset }: PortfolioBlockProps) {
  const { t } = useTranslation(["investments", "common"]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("investments:blocks.portfolio.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  if (!portfolio || !assets || assets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("investments:blocks.portfolio.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t("investments:messages.empty")}</p>
          {onAddAsset && (
            <Button onClick={onAddAsset} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              {t("investments:blocks.portfolio.add_asset")}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const totalInvested = portfolio.total_invested || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t("investments:blocks.portfolio.title")}</CardTitle>
          {onAddAsset && (
            <Button variant="outline" size="sm" onClick={onAddAsset}>
              <Plus className="mr-2 h-4 w-4" />
              {t("investments:blocks.portfolio.add_asset")}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumo - mobile-first grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4 bg-muted rounded-lg">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">{t("investments:blocks.portfolio.total_invested")}</p>
            <p className="text-base sm:text-lg font-semibold">R$ {totalInvested.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">{t("investments:blocks.portfolio.current_value")}</p>
            <p className="text-base sm:text-lg font-semibold">R$ {totalInvested.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">{t("investments:blocks.portfolio.variation")}</p>
            <p className="text-base sm:text-lg font-semibold flex items-center gap-1">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
              +0,00%
            </p>
          </div>
        </div>

        {/* Lista de ativos */}
        <div className="space-y-2">
          {assets.map((asset) => (
            <AssetRow key={asset.id} asset={asset} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AssetRow({ asset }: { asset: Asset }) {
  const { data: quote, isLoading: loadingQuote } = useQuote(asset.ticker);

  const currentPrice = quote?.price || parseFloat(asset.average_price);
  const quantity = parseFloat(asset.quantity);
  const averagePrice = parseFloat(asset.average_price);
  const currentValue = currentPrice * quantity;
  const variation = ((currentPrice - averagePrice) / averagePrice) * 100;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-3 border rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <Badge variant="outline" className="text-xs">{asset.ticker}</Badge>
          <span className="text-xs sm:text-sm text-muted-foreground">{quantity} unidades</span>
        </div>
        <div className="text-xs text-muted-foreground space-y-0.5">
          <div>Preço médio: R$ {averagePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
          {!loadingQuote && quote && (
            <div>Atual: R$ {currentPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right gap-2 sm:gap-0">
        <p className="text-sm sm:text-base font-semibold">
          R$ {currentValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
        <p className={`text-xs flex items-center gap-1 ${variation >= 0 ? "text-green-500" : "text-red-500"}`}>
          {variation >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {variation >= 0 ? "+" : ""}
          {variation.toFixed(2)}%
        </p>
      </div>
    </div>
  );
}


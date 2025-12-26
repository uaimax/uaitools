/** Visualização de sugestões de investimento. */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Wallet, Loader2, CheckCircle2, Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { usePortfolio, useAnalyzeInvestment } from "../hooks/use-investments";
import { formatCurrency } from "@/lib/utils";

interface SuggestionsViewProps {
  portfolioId: string | null;
}

export function SuggestionsView({ portfolioId }: SuggestionsViewProps) {
  const { t } = useTranslation(["investments", "common"]);
  const { data: portfolio, isLoading: loadingPortfolio } = usePortfolio(portfolioId);
  const analyzeMutation = useAnalyzeInvestment();
  const [amount, setAmount] = useState("");

  if (!portfolioId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center py-8">
            {t("investments:portfolios.select_portfolio")}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loadingPortfolio) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center py-8">
            {t("common:messages.loading")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleAnalyze = async () => {
    if (!portfolioId || !amount || parseFloat(amount) <= 0) {
      return;
    }

    try {
      await analyzeMutation.mutateAsync({
        portfolioId,
        amount: parseFloat(amount),
      });
    } catch (error) {
      // Error handling via toast (já feito no hook)
    }
  };

  const recommendation = analyzeMutation.data?.recommendation;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Card de input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            {t("investments:suggestions_view.selected_portfolio")}:{" "}
            <span className="text-primary">
              {portfolio?.name || t("investments:portfolios.default_name")}
            </span>
            . {t("investments:suggestions_view.enter_amount")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                step="0.01"
                placeholder={t("investments:placeholders.amount")}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={!portfolioId || !amount || parseFloat(amount) <= 0 || analyzeMutation.isPending}
              className="w-full sm:w-auto"
            >
              {analyzeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("investments:messages.analyzing")}
                </>
              ) : (
                t("investments:suggestions_view.analyze_contribution")
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Card de Plano de Ação */}
      {recommendation && (
        <Card>
          <CardHeader>
            <CardTitle>{t("investments:suggestions_view.action_plan")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendation.message ? (
              <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-500/20">
                <span className="text-2xl">🔴</span>
                <p className="text-sm sm:text-base font-medium">{recommendation.message}</p>
              </div>
            ) : (
              <>
                {recommendation.allocations.map((allocation, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-muted rounded-lg"
                  >
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base">
                        {allocation.quantity && allocation.unit_price ? (
                          <>
                            Compre {allocation.quantity} ações de{" "}
                            <Badge variant="outline" className="mx-1">
                              {allocation.ticker}
                            </Badge>
                            por {formatCurrency(allocation.unit_price)} cada (
                            {formatCurrency(allocation.amount)})
                          </>
                        ) : (
                          <>
                            {allocation.reason || `${formatCurrency(allocation.amount)} em ${allocation.ticker}`}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                ))}

                {recommendation.remaining_balance !== undefined && recommendation.remaining_balance > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg border-2 border-orange-500/20">
                    <Coins className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm sm:text-base font-medium">
                        {t("investments:suggestions_view.remaining_balance")}:{" "}
                        {formatCurrency(recommendation.remaining_balance)}
                      </p>
                    </div>
                  </div>
                )}

                {recommendation.reasoning && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">{recommendation.reasoning}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {analyzeMutation.isError && (
        <Card>
          <CardContent className="pt-6">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                {analyzeMutation.error?.message || "Erro ao gerar recomendação"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


/** Bloco de recomendação de investimento. */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAnalyzeInvestment } from "../hooks/use-investments";
import type { Portfolio } from "../hooks/use-investments";

interface InvestBlockProps {
  portfolio: Portfolio | undefined;
}

export function InvestBlock({ portfolio }: InvestBlockProps) {
  const { t } = useTranslation(["investments", "common"]);
  const [amount, setAmount] = useState("");
  const analyzeMutation = useAnalyzeInvestment();

  const handleAnalyze = async () => {
    if (!portfolio || !amount || parseFloat(amount) <= 0) {
      return;
    }

    try {
      await analyzeMutation.mutateAsync({
        portfolioId: portfolio.id,
        amount: parseFloat(amount),
      });
    } catch (error) {
      // Error handling via toast (já feito no hook)
    }
  };

  const recommendation = analyzeMutation.data?.recommendation;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("investments:blocks.invest.title")}</CardTitle>
        <CardDescription>
          Digite o valor que você tem para investir e receba uma recomendação
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">{t("investments:blocks.invest.input_label")}</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder={t("investments:placeholders.amount")}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleAnalyze}
              disabled={!portfolio || !amount || parseFloat(amount) <= 0 || analyzeMutation.isPending}
              className="w-full sm:w-auto"
            >
              {analyzeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">{t("investments:messages.analyzing")}</span>
                  <span className="sm:hidden">{t("investments:messages.analyzing")}</span>
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">{t("investments:blocks.invest.button")}</span>
                  <span className="sm:hidden">Analisar</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {analyzeMutation.isError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              {analyzeMutation.error?.message || "Erro ao gerar recomendação"}
            </p>
          </div>
        )}

        {recommendation && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">{t("investments:blocks.invest.recommendation_title")}</h4>
              <Badge variant="secondary">
                Total: R$ {recommendation.total_amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </Badge>
            </div>

            {recommendation.reasoning && (
              <p className="text-sm text-muted-foreground">{recommendation.reasoning}</p>
            )}

            <div className="space-y-2">
              {recommendation.allocations.map((allocation, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-muted rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">{allocation.ticker}</Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{allocation.reason}</p>
                  </div>
                  <p className="text-sm sm:text-base font-semibold sm:text-right">
                    R$ {allocation.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


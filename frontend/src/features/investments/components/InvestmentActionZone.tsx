/** Zona 1: Ação Principal - Input de investimento e resultado. */

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSmartRecommendation } from "../hooks/use-smart-investments";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface InvestmentActionZoneProps {
  portfolioId: string | null;
}

export function InvestmentActionZone({ portfolioId }: InvestmentActionZoneProps) {
  const [amount, setAmount] = useState("");
  const smartRecommendation = useSmartRecommendation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const formatCurrency = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, "");
    if (!numbers) return "";

    // Converte para número e formata
    const num = parseInt(numbers, 10) / 100;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(num);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setAmount(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolioId) return;

    // Extrair valor numérico
    const numericValue = parseFloat(amount.replace(/[^\d,]/g, "").replace(",", "."));
    if (isNaN(numericValue) || numericValue <= 0) {
      toast({
        title: "Valor inválido",
        description: "Digite um valor válido para investir",
        variant: "destructive",
      });
      return;
    }

    try {
      await smartRecommendation.mutateAsync({
        portfolioId,
        amount: numericValue,
      });
      // Invalidar queries de ativos para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ["investments", "assets"] });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar a recomendação. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const recommendation = smartRecommendation.data;
  const hasRecommendation = recommendation && recommendation.recommendation?.allocations?.length > 0;

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Quanto você quer investir?</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="R$ 0,00"
              value={amount}
              onChange={handleAmountChange}
              disabled={smartRecommendation.isPending || !portfolioId}
              className="text-lg font-semibold"
            />
            <Button
              type="submit"
              disabled={smartRecommendation.isPending || !portfolioId || !amount}
              size="lg"
            >
              {smartRecommendation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Ver sugestão
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Resultado da Recomendação */}
        {smartRecommendation.isSuccess && hasRecommendation && (
          <div className="mt-6 p-4 bg-muted rounded-lg space-y-3">
            <h3 className="font-semibold">Sugestão de investimento</h3>
            {recommendation.recommendation.allocations.map((allocation: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-background rounded border"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="font-mono">
                      {allocation.ticker}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {allocation.quantity} ações
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{allocation.reason}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    R$ {allocation.amount.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            ))}
            {recommendation.recommendation.reasoning && (
              <p className="text-sm text-muted-foreground mt-2">
                {recommendation.recommendation.reasoning}
              </p>
            )}
          </div>
        )}

        {smartRecommendation.isSuccess && !hasRecommendation && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              {recommendation?.recommendation?.reasoning ||
                "Nenhuma ação recomendada no momento. Aguarde melhores oportunidades."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


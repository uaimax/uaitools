/** Componente unificado para editar carteira e estratégia. */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Save, X, ChevronDown, ChevronUp, Settings2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useStrategy, useUpdateStrategy } from "../hooks/use-investments";
import { useToast } from "@/stores/toast-store";
import { PortfoliosView } from "./PortfoliosView";

interface PortfolioEditorProps {
  portfolioId: string;
}

export function PortfolioEditor({ portfolioId }: PortfolioEditorProps) {
  const { t } = useTranslation(["investments", "common"]);
  const { toast } = useToast();
  const { data: strategy, isLoading: strategyLoading, refetch: refetchStrategy } = useStrategy(portfolioId);
  const updateStrategy = useUpdateStrategy();

  const [isEditingStrategy, setIsEditingStrategy] = useState(false);
  const [editedStrategyText, setEditedStrategyText] = useState("");
  const [showStrategySection, setShowStrategySection] = useState(true);
  const [showPortfolioSection, setShowPortfolioSection] = useState(true);

  // Inicializar texto da estratégia quando carregar
  useEffect(() => {
    if (strategy && strategy.raw_text && strategy.raw_text.trim()) {
      setEditedStrategyText(strategy.raw_text);
    } else {
      // Se estratégia não existe ou está vazia, usar padrão
      const defaultText = "Estratégia padrão: Foco em dividendos com DY mínimo de 8% e setores defensivos. Apenas ações da B3. Preço teto de entrada = dividendo / 0.08. Só comprar ações com cotação ≤ preço-teto e que estejam abaixo da alocação máxima.";
      setEditedStrategyText(defaultText);
    }
  }, [strategy]);

  const handleStartEditStrategy = () => {
    const defaultText = "Estratégia padrão: Foco em dividendos com DY mínimo de 8% e setores defensivos. Apenas ações da B3. Preço teto de entrada = dividendo / 0.08. Só comprar ações com cotação ≤ preço-teto e que estejam abaixo da alocação máxima.";
    if (strategy && strategy.raw_text && strategy.raw_text.trim()) {
      setEditedStrategyText(strategy.raw_text);
    } else {
      setEditedStrategyText(defaultText);
    }
    setIsEditingStrategy(true);
  };

  const handleCancelEditStrategy = () => {
    setIsEditingStrategy(false);
    const defaultText = "Estratégia padrão: Foco em dividendos com DY mínimo de 8% e setores defensivos. Apenas ações da B3. Preço teto de entrada = dividendo / 0.08. Só comprar ações com cotação ≤ preço-teto e que estejam abaixo da alocação máxima.";
    if (strategy && strategy.raw_text && strategy.raw_text.trim()) {
      setEditedStrategyText(strategy.raw_text);
    } else {
      setEditedStrategyText(defaultText);
    }
  };

  const handleSaveStrategy = async () => {
    if (!editedStrategyText.trim()) {
      toast({
        title: t("common:errors.error"),
        description: "Estratégia não pode estar vazia",
        variant: "destructive",
      });
      return;
    }

    try {
      // Se estratégia não existe ainda, aguardar criação pelo backend
      if (!strategy || !strategy.id) {
        // Aguardar estratégia ser criada
        await new Promise(resolve => setTimeout(resolve, 1000));
        const result = await refetchStrategy();
        if (result.data && result.data.id) {
          await updateStrategy.mutateAsync({
            id: result.data.id,
            data: { raw_text: editedStrategyText.trim() },
          });
        } else {
          throw new Error("Estratégia não foi criada automaticamente. Tente novamente.");
        }
      } else {
        await updateStrategy.mutateAsync({
          id: strategy.id,
          data: { raw_text: editedStrategyText.trim() },
        });
      }
      setIsEditingStrategy(false);
      await refetchStrategy();
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

  const defaultStrategyText = "Estratégia padrão: Foco em dividendos com DY mínimo de 8% e setores defensivos. Apenas ações da B3. Preço teto de entrada = dividendo / 0.08. Só comprar ações com cotação ≤ preço-teto e que estejam abaixo da alocação máxima.";
  const displayStrategyText = (strategy?.raw_text && strategy.raw_text.trim()) ? strategy.raw_text : defaultStrategyText;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Seção de Estratégia - Colapsável */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowStrategySection(!showStrategySection)}
              >
                {showStrategySection ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              <CardTitle className="text-lg">{t("investments:fields.strategy")}</CardTitle>
              {strategy?.strategy_type && (
                <Badge variant="secondary" className="ml-2">
                  {strategy.strategy_type_display || strategy.strategy_type}
                </Badge>
              )}
            </div>
            {!isEditingStrategy && showStrategySection && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartEditStrategy}
                disabled={strategyLoading}
              >
                <Pencil className="h-4 w-4 mr-2" />
                {strategy ? t("common:actions.edit") : t("common:actions.create")}
              </Button>
            )}
          </div>
        </CardHeader>
        {showStrategySection && (
          <CardContent className="space-y-4">
            {strategyLoading ? (
              <div className="space-y-3">
                <div className="p-4 bg-muted/50 rounded-lg border animate-pulse">
                  <div className="h-4 bg-muted-foreground/20 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted-foreground/20 rounded w-full mb-2"></div>
                  <div className="h-4 bg-muted-foreground/20 rounded w-5/6"></div>
                </div>
              </div>
            ) : isEditingStrategy ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="strategy-edit">{t("investments:fields.strategy")}</Label>
                  <Textarea
                    id="strategy-edit"
                    value={editedStrategyText}
                    onChange={(e) => setEditedStrategyText(e.target.value)}
                    rows={6}
                    placeholder={t("investments:placeholders.strategy")}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEditStrategy}
                    disabled={updateStrategy.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t("common:actions.cancel")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveStrategy}
                    disabled={updateStrategy.isPending || !editedStrategyText.trim()}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateStrategy.isPending ? t("common:messages.loading") : t("common:actions.save")}
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {displayStrategyText}
                  </p>
                </div>
                {strategy?.parsed_rules?.criteria && Object.keys(strategy.parsed_rules.criteria).length > 0 && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs font-medium mb-2 text-muted-foreground">
                      {t("investments:strategy.parsed_criteria")}
                    </p>
                    <div className="space-y-1 text-xs">
                      {strategy.parsed_rules.criteria.dividend_yield_min && (
                        <p>DY mínimo: <strong>{(strategy.parsed_rules.criteria.dividend_yield_min * 100).toFixed(1)}%</strong></p>
                      )}
                      {strategy.parsed_rules.criteria.pe_ratio_max && (
                        <p>P/L máximo: <strong>{strategy.parsed_rules.criteria.pe_ratio_max}</strong></p>
                      )}
                      {strategy.parsed_rules.criteria.price_to_book_max && (
                        <p>P/VP máximo: <strong>{strategy.parsed_rules.criteria.price_to_book_max}</strong></p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Seção de Carteira - Colapsável */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowPortfolioSection(!showPortfolioSection)}
              >
                {showPortfolioSection ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              <CardTitle className="text-lg">{t("investments:portfolios_view.title")}</CardTitle>
            </div>
            <Settings2 className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        {showPortfolioSection && (
          <div className="px-6 pb-6">
            <PortfoliosView portfolioId={portfolioId} />
          </div>
        )}
      </Card>
    </div>
  );
}


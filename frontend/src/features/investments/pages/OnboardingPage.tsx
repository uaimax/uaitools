/** Página de onboarding para configuração inicial do consultor de investimentos. */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { InvestmentsLayout } from "../components/layout/InvestmentsLayout";
import { useCreatePortfolio, useCreateAsset, useCreateStrategy, usePortfolios, type Portfolio } from "../hooks/use-investments";
import { useToast } from "@/stores/toast-store";

interface AssetForm {
  ticker: string;
  quantity: string;
  average_price: string;
}

export default function OnboardingPage() {
  const { t } = useTranslation(["investments", "common"]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<1 | 2>(1);
  const [assets, setAssets] = useState<AssetForm[]>([{ ticker: "", quantity: "", average_price: "" }]);
  const [strategy, setStrategy] = useState("");

  const createPortfolio = useCreatePortfolio();
  const createAsset = useCreateAsset();
  const createStrategyMutation = useCreateStrategy();
  const { data: existingPortfolios } = usePortfolios();

  const handleAddAsset = () => {
    setAssets([...assets, { ticker: "", quantity: "", average_price: "" }]);
  };

  const handleRemoveAsset = (index: number) => {
    setAssets(assets.filter((_, i) => i !== index));
  };

  const handleAssetChange = (index: number, field: keyof AssetForm, value: string) => {
    const newAssets = [...assets];
    newAssets[index][field] = value;
    setAssets(newAssets);
  };

  const handleNext = () => {
    if (step === 1) {
      // Validar que pelo menos um ativo tem ticker
      const hasValidAsset = assets.some((a) => a.ticker.trim() !== "");
      if (!hasValidAsset) {
        toast({
          title: t("common:errors.error"),
          description: t("investments:onboarding.errors.no_assets"),
          variant: "destructive",
        });
        return;
      }
      setStep(2);
    }
  };

  const handleFinish = async () => {
    if (!strategy.trim()) {
      toast({
        title: t("common:errors.error"),
        description: t("investments:onboarding.errors.no_strategy"),
        variant: "destructive",
      });
      return;
    }

    try {
      // Criar portfolio
      // Verificar se já existe uma carteira deste tipo antes de criar
      let portfolio = existingPortfolios?.find(p => p.portfolio_type === "acoes_br");

      if (!portfolio) {
        try {
          portfolio = await createPortfolio.mutateAsync({
            portfolio_type: "acoes_br",
            name: t("investments:blocks.portfolio.title"),
          });
        } catch (portfolioError: any) {
          // Se erro 400 e menciona "unique" ou "já existe", buscar carteira existente
          if (portfolioError.response?.status === 400) {
            const errorData = portfolioError.response.data;
            const errorMessage = typeof errorData === 'object'
              ? JSON.stringify(errorData)
              : String(errorData);

            if (errorMessage.includes('unique') || errorMessage.includes('já existe') || errorMessage.includes('already exists')) {
              // Buscar carteira existente via API
              const { apiClient } = await import("@/config/api");
              try {
                const portfoliosResponse = await apiClient.get<{ results?: Portfolio[] } | Portfolio[]>("/investments/portfolios/");
                const portfolios = Array.isArray(portfoliosResponse.data)
                  ? portfoliosResponse.data
                  : portfoliosResponse.data.results || [];
                const existingPortfolio = portfolios.find(p => p.portfolio_type === "acoes_br");

                if (existingPortfolio) {
                  portfolio = existingPortfolio;
                } else {
                  throw new Error(t("investments:onboarding.errors.portfolio_exists"));
                }
              } catch (fetchError) {
                // Se não conseguir buscar, mostrar erro genérico
                throw new Error(t("investments:onboarding.errors.portfolio_exists"));
              }
            } else {
              throw portfolioError;
            }
          } else {
            throw portfolioError;
          }
        }
      }

      // Criar ativos
      for (const asset of assets) {
        if (asset.ticker.trim()) {
          await createAsset.mutateAsync({
            portfolio: portfolio.id,
            ticker: asset.ticker.trim().toUpperCase(),
            quantity: asset.quantity,
            average_price: asset.average_price,
          });
        }
      }

      // Criar estratégia
      await createStrategyMutation.mutateAsync({
        portfolio: portfolio.id,
        raw_text: strategy.trim(),
      });

      toast({
        title: t("common:messages.success"),
        description: t("investments:toasts.create_success"),
      });

      navigate("/investments");
    } catch (error: any) {
      // Extrair mensagem de erro mais descritiva
      let errorMessage = error.message || t("investments:toasts.create_error");

      if (error.response?.data) {
        const errorData = error.response.data;

        // Tentar extrair mensagem de erro do backend
        if (typeof errorData === 'object') {
          // DRF geralmente retorna { field: [errors] } ou { detail: "message" }
          if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.non_field_errors) {
            errorMessage = Array.isArray(errorData.non_field_errors)
              ? errorData.non_field_errors.join(", ")
              : errorData.non_field_errors;
          } else {
            // Pegar primeiro erro de qualquer campo
            const firstError = Object.values(errorData)[0];
            if (Array.isArray(firstError)) {
              errorMessage = firstError[0];
            } else if (typeof firstError === 'string') {
              errorMessage = firstError;
            }
          }
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      }

      toast({
        title: t("common:errors.error"),
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleExampleClick = (example: string) => {
    setStrategy(example);
  };

  return (
    <InvestmentsLayout
      showBack={false}
      showHeader={true}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t("investments:title.onboarding")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            {t("investments:onboarding.description")}
          </p>
        </div>

        {/* Step indicator - mobile-first */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className={`flex items-center gap-1 sm:gap-2 ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm sm:text-base ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              1
            </div>
            <span className="text-sm sm:text-base">{t("investments:onboarding.step1")}</span>
          </div>
          <div className="flex-1 h-px bg-border" />
          <div className={`flex items-center gap-1 sm:gap-2 ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm sm:text-base ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              2
            </div>
            <span className="text-sm sm:text-base">{t("investments:onboarding.step2")}</span>
          </div>
        </div>

        {/* Step 1: Assets */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("investments:onboarding.step1_title")}</CardTitle>
              <CardDescription>
                {t("investments:onboarding.step1_description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {assets.map((asset, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end">
                  <div className="flex-1 min-w-0">
                    <Label htmlFor={`ticker-${index}`} className="text-sm">{t("investments:fields.ticker")}</Label>
                    <Input
                      id={`ticker-${index}`}
                      placeholder={t("investments:placeholders.ticker")}
                      value={asset.ticker}
                      onChange={(e) => handleAssetChange(index, "ticker", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Label htmlFor={`quantity-${index}`} className="text-sm">{t("investments:fields.quantity")}</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      placeholder={t("investments:placeholders.quantity")}
                      value={asset.quantity}
                      onChange={(e) => handleAssetChange(index, "quantity", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Label htmlFor={`price-${index}`} className="text-sm">{t("investments:fields.average_price")}</Label>
                    <Input
                      id={`price-${index}`}
                      type="number"
                      step="0.01"
                      placeholder={t("investments:placeholders.average_price")}
                      value={asset.average_price}
                      onChange={(e) => handleAssetChange(index, "average_price", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  {assets.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveAsset(index)}
                      className="self-end sm:self-auto"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              <Button type="button" variant="outline" onClick={handleAddAsset}>
                <Plus className="mr-2 h-4 w-4" />
                {t("investments:onboarding.add_asset")}
              </Button>

              <div className="flex justify-end pt-4">
                <Button onClick={handleNext} className="w-full sm:w-auto">
                  {t("investments:onboarding.next")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Strategy */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("investments:onboarding.step2_title")}</CardTitle>
              <CardDescription>
                {t("investments:onboarding.step2_description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="strategy">{t("investments:fields.strategy")}</Label>
                <Textarea
                  id="strategy"
                  placeholder={t("investments:placeholders.strategy")}
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                  rows={6}
                />
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">{t("investments:onboarding.examples_label")}</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleExampleClick(t("investments:examples.dividendos"))}
                  >
                    {t("investments:examples.dividendos")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleExampleClick(t("investments:examples.value"))}
                  >
                    {t("investments:examples.value")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleExampleClick(t("investments:examples.growth"))}
                  >
                    {t("investments:examples.growth")}
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  {t("investments:onboarding.back")}
                </Button>
                <Button
                  onClick={handleFinish}
                  disabled={createPortfolio.isPending || createAsset.isPending || createStrategyMutation.isPending}
                  className="w-full sm:w-auto order-1 sm:order-2"
                >
                  {createPortfolio.isPending || createAsset.isPending || createStrategyMutation.isPending
                    ? t("common:messages.loading")
                    : t("investments:onboarding.start")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </InvestmentsLayout>
  );
}


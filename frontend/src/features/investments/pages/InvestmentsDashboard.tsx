/** Dashboard principal do consultor de investimentos com layout unificado. */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { InvestmentsLayout } from "../components/layout/InvestmentsLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PortfolioManager } from "../components/PortfolioManager";
import { SuggestionsView } from "../components/SuggestionsView";
import { PortfolioEditor } from "../components/PortfolioEditor";
import { usePortfolios } from "../hooks/use-investments";

export default function InvestmentsDashboard() {
  const { t } = useTranslation(["investments", "common"]);
  const navigate = useNavigate();
  const { data: portfolios = [], isLoading } = usePortfolios();
  const [activeTab, setActiveTab] = useState<"suggestions" | "portfolios">("suggestions");
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);

  // Selecionar primeira carteira disponível
  useEffect(() => {
    if (!isLoading && portfolios.length > 0 && !selectedPortfolioId) {
      setSelectedPortfolioId(portfolios[0].id);
    }
  }, [portfolios, isLoading, selectedPortfolioId]);

  // Redirecionar para onboarding se não houver carteiras
  useEffect(() => {
    if (!isLoading && portfolios.length === 0) {
      navigate("/investments/onboarding");
    }
  }, [portfolios, isLoading, navigate]);

  if (isLoading) {
    return (
      <InvestmentsLayout showHeader={true}>
        <div className="space-y-6">
          <p className="text-muted-foreground text-center py-8">
            {t("common:messages.loading")}
          </p>
        </div>
      </InvestmentsLayout>
    );
  }

  if (portfolios.length === 0) {
    return (
      <InvestmentsLayout showHeader={true}>
        <div className="space-y-6">
          <p className="text-muted-foreground text-center py-8">
            Redirecionando para configuração inicial...
          </p>
        </div>
      </InvestmentsLayout>
    );
  }

  // Garantir que temos um portfolio selecionado
  const currentPortfolioId = selectedPortfolioId || portfolios[0]?.id || null;

  return (
    <InvestmentsLayout showHeader={true}>
      <div className="space-y-4 sm:space-y-6">
        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "suggestions" | "portfolios")}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="suggestions" className="flex-1 sm:flex-initial">
              {t("investments:tabs.suggestions")}
            </TabsTrigger>
            <TabsTrigger value="portfolios" className="flex-1 sm:flex-initial">
              {t("investments:tabs.portfolios")}
            </TabsTrigger>
          </TabsList>

          {/* Tab: Sugestões */}
          <TabsContent value="suggestions">
            <SuggestionsView portfolioId={currentPortfolioId} />
          </TabsContent>

          {/* Tab: Carteiras */}
          <TabsContent value="portfolios">
            <div className="space-y-4 sm:space-y-6">
              <PortfolioManager
                selectedPortfolioId={currentPortfolioId}
                onPortfolioChange={setSelectedPortfolioId}
              />
              {currentPortfolioId && (
                <PortfolioEditor portfolioId={currentPortfolioId} />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </InvestmentsLayout>
  );
}

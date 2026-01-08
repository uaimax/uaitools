/** Página principal de investimentos - Interface unificada com 3 zonas verticais. */

import { useState, useEffect } from "react";
import { Wallet, Plus } from "lucide-react";
import { InvestmentsHeader } from "../components/InvestmentsHeader";
import { InvestmentActionZone } from "../components/InvestmentActionZone";
import { PortfolioZone } from "../components/PortfolioZone";
import { ChatZone } from "../components/ChatZone";
import { AssetModal } from "../components/AssetModal";
import { SettingsModal } from "../components/SettingsModal";
import { PortfolioModal } from "../components/PortfolioModal";
import { Button } from "@/components/ui/button";
import { usePortfolios } from "../hooks/use-investments";

export default function InvestmentsPage() {
  const { data: portfolios = [], isLoading, refetch } = usePortfolios();
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);

  // Selecionar primeira carteira disponível
  useEffect(() => {
    if (!isLoading && portfolios.length > 0 && !selectedPortfolioId) {
      setSelectedPortfolioId(portfolios[0].id);
    }
  }, [portfolios, isLoading, selectedPortfolioId]);

  const handlePortfolioCreated = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (portfolios.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <InvestmentsHeader
          portfolios={[]}
          selectedPortfolioId={null}
          onSelectPortfolio={() => {}}
          onOpenSettings={() => setShowSettingsModal(true)}
        />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-6 max-w-md">
            <div className="flex justify-center">
              <div className="rounded-full bg-primary/10 p-6">
                <Wallet className="h-12 w-12 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Nenhuma carteira encontrada</h2>
              <p className="text-muted-foreground">
                Crie sua primeira carteira de investimentos para começar a gerenciar seus ativos.
              </p>
            </div>
            <Button
              onClick={() => setShowPortfolioModal(true)}
              size="lg"
              className="gap-2"
            >
              <Plus className="h-5 w-5" />
              Criar Primeira Carteira
            </Button>
            <p className="text-xs text-muted-foreground">
              Você poderá adicionar ativos, definir estratégias e receber recomendações personalizadas.
            </p>
          </div>
        </div>
        <PortfolioModal
          open={showPortfolioModal}
          onOpenChange={setShowPortfolioModal}
          onSuccess={handlePortfolioCreated}
        />
      </div>
    );
  }

  const handleAddAsset = () => {
    setEditingAsset(null);
    setShowAssetModal(true);
  };


  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Fixo */}
      <InvestmentsHeader
        portfolios={portfolios}
        selectedPortfolioId={selectedPortfolioId}
        onSelectPortfolio={setSelectedPortfolioId}
        onOpenSettings={() => setShowSettingsModal(true)}
        onCreatePortfolio={() => setShowPortfolioModal(true)}
      />

      {/* Conteúdo Principal - 3 Zonas Verticais */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-6 gap-6">
        {/* Zona 1: Ação Principal (25%) */}
        <div className="flex-shrink-0" style={{ minHeight: "25vh" }}>
          <InvestmentActionZone portfolioId={selectedPortfolioId} />
        </div>

        {/* Zona 2: Carteira (40%) */}
        <div className="flex-1" style={{ minHeight: "40vh" }}>
          <PortfolioZone
            portfolioId={selectedPortfolioId}
            onAddAsset={handleAddAsset}
          />
        </div>

        {/* Zona 3: Chat (35%) */}
        <div className="flex-1" style={{ minHeight: "35vh" }}>
          <ChatZone portfolioId={selectedPortfolioId} />
        </div>
      </main>

      {/* Modais */}
      <AssetModal
        portfolioId={selectedPortfolioId}
        asset={editingAsset}
        open={showAssetModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowAssetModal(false);
            setEditingAsset(null);
          }
        }}
      />

      <SettingsModal
        portfolioId={selectedPortfolioId}
        open={showSettingsModal}
        onOpenChange={setShowSettingsModal}
      />

      <PortfolioModal
        open={showPortfolioModal}
        onOpenChange={setShowPortfolioModal}
        onSuccess={handlePortfolioCreated}
      />
    </div>
  );
}


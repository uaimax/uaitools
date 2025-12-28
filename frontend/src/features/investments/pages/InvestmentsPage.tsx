/** Página principal de investimentos - Interface unificada com 3 zonas verticais. */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { InvestmentsHeader } from "../components/InvestmentsHeader";
import { InvestmentActionZone } from "../components/InvestmentActionZone";
import { PortfolioZone } from "../components/PortfolioZone";
import { ChatZone } from "../components/ChatZone";
import { AssetModal } from "../components/AssetModal";
import { SettingsModal } from "../components/SettingsModal";
import { usePortfolios } from "../hooks/use-investments";
import { usePortfolioContext } from "../hooks/use-smart-investments";

export default function InvestmentsPage() {
  const navigate = useNavigate();
  const { data: portfolios = [], isLoading } = usePortfolios();
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Selecionar primeira carteira disponível
  useEffect(() => {
    if (!isLoading && portfolios.length > 0 && !selectedPortfolioId) {
      setSelectedPortfolioId(portfolios[0].id);
    }
  }, [portfolios, isLoading, selectedPortfolioId]);

  // Se não houver carteiras, mostrar mensagem (seed automático deve criar)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (portfolios.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Nenhuma carteira encontrada. Execute o seed para criar dados iniciais.
          </p>
        </div>
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
    </div>
  );
}


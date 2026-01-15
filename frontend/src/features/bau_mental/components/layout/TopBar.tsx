/** Top bar com busca/pergunta global. */

import { useState } from "react";
import { SearchBar } from "../SearchBar";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { Settings, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { TextIngestionModal } from "../TextIngestionModal";
import { SettingsModal } from "../SettingsModal";

interface TopBarProps {
  onSearch?: (query: string) => void;
}

export function TopBar({ onSearch }: TopBarProps) {
  const navigate = useNavigate();
  const [showTextIngestion, setShowTextIngestion] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <header className="h-16 border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 flex items-center px-4 gap-4 flex-shrink-0 relative z-20">
        {/* Logo/Título */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/bau-mental")}
            className="text-lg font-semibold hover:opacity-80 transition-opacity"
          >
            Baú Mental
          </button>
        </div>

        {/* Busca */}
        <div className="flex-1 max-w-2xl relative">
          <SearchBar onSearch={onSearch} />
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTextIngestion(true)}
            title="Adicionar texto"
          >
            <FileText className="w-4 h-4" />
          </Button>
          <NotificationBell />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(true)}
            title="Configurações"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <TextIngestionModal
        open={showTextIngestion}
        onOpenChange={setShowTextIngestion}
      />
      <SettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
      />
    </>
  );
}

/** Header fixo com logo, seletor de carteira e menu do usuário. */

import { useState } from "react";
import { Sparkles, ChevronDown, Settings, LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectItem } from "@/components/ui/select";
import { useAuthStore } from "@/stores/auth-store";
import { useNavigate } from "react-router-dom";
import type { Portfolio } from "../hooks/use-investments";

interface InvestmentsHeaderProps {
  portfolios: Portfolio[];
  selectedPortfolioId: string | null;
  onSelectPortfolio: (portfolioId: string) => void;
  onOpenSettings: () => void;
}

export function InvestmentsHeader({
  portfolios,
  selectedPortfolioId,
  onSelectPortfolio,
  onOpenSettings,
}: InvestmentsHeaderProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("workspace_id");
    useAuthStore.getState().setUser(null);
    navigate("/login");
  };

  const getUserInitials = () => {
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
        {/* Esquerda - Logo */}
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg hidden sm:inline">InvestIA</span>
        </div>

        {/* Centro - Seletor de Carteira */}
        <div className="flex-1 flex justify-center px-4">
          <div className="w-full max-w-xs">
            {portfolios.length > 0 && (
              <Select
                value={selectedPortfolioId || ""}
                onChange={onSelectPortfolio}
                placeholder="Selecione uma carteira"
              >
                {portfolios.map((portfolio) => (
                  <SelectItem key={portfolio.id} value={portfolio.id}>
                    {portfolio.name || "Carteira Principal"}
                  </SelectItem>
                ))}
              </Select>
            )}
          </div>
        </div>

        {/* Direita - Menu do Usuário */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-auto p-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline text-sm font-medium">
                {user?.email?.split("@")[0] || "Usuário"}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Minha conta</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenSettings}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}


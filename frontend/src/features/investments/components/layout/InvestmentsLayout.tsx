/** Layout mobile-first para o módulo de investimentos. */

import { type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { InvestmentsHeader } from "./InvestmentsHeader";

interface InvestmentsLayoutProps {
  children: ReactNode;
  showBack?: boolean;
  backTo?: string;
  showHeader?: boolean;
}

export function InvestmentsLayout({
  children,
  showBack = false,
  backTo = "/investments",
  showHeader = true,
}: InvestmentsLayoutProps) {
  const { t } = useTranslation(["investments", "common"]);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header mobile-first */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          {showBack && (
            <div className="h-14 flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(backTo)}
                className="h-9 w-9"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Mobile menu button - apenas se não mostrar header */}
          {!showHeader && (
            <div className="h-14 flex items-center justify-between">
              <Link to="/investments" className="text-lg font-semibold">
                {t("investments:title.investments")}
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-9 w-9"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          )}

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t bg-background">
              <nav className="py-2 space-y-1">
                <Link
                  to="/investments"
                  className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("investments:title.dashboard")}
                </Link>
                <Link
                  to="/investments/onboarding"
                  className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("investments:title.onboarding")}
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-4 sm:py-6 max-w-4xl">
        {showHeader && <InvestmentsHeader />}
        {children}
      </main>

      {/* Footer minimalista */}
      <footer className="border-t py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>{t("investments:title.investments")}</p>
        </div>
      </footer>
    </div>
  );
}


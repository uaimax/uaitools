/** Header estilo das imagens para o módulo de investimentos. */

import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";

export function InvestmentsHeader() {
  const { t } = useTranslation(["investments"]);

  return (
    <div className="text-center space-y-2 py-6">
      <div className="flex items-center justify-center gap-2">
        <Lock className="h-5 w-5 text-primary" />
        <h1 className="text-2xl sm:text-3xl font-bold">
          {t("investments:header.title")}
        </h1>
      </div>
      <p className="text-sm sm:text-base text-muted-foreground">
        {t("investments:header.subtitle")}
      </p>
    </div>
  );
}




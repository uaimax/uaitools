/** Componente para trocar idioma da aplicação. */

import { useTranslation } from "react-i18next";
import { Select, SelectItem } from "@/components/ui/select";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={i18n.language} onChange={changeLanguage} className="w-[120px]">
        <SelectItem value="pt">Português</SelectItem>
        <SelectItem value="en">English</SelectItem>
      </Select>
    </div>
  );
}


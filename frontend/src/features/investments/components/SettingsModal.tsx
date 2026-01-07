/** Modal de configurações - Preferências do usuário. */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { usePortfolioPreferences, useUpdatePortfolioPreferences } from "../hooks/use-smart-investments";
import { useToast } from "@/hooks/use-toast";

interface SettingsModalProps {
  portfolioId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ portfolioId, open, onOpenChange }: SettingsModalProps) {
  const { toast } = useToast();
  const { data: preferences } = usePortfolioPreferences(portfolioId);
  const updatePreferences = useUpdatePortfolioPreferences();

  const [excludedSectors, setExcludedSectors] = useState<string[]>([]);
  const [preferredSectors, setPreferredSectors] = useState<string[]>([]);
  const [additionalCriteria, setAdditionalCriteria] = useState("");
  const [newSector, setNewSector] = useState("");

  useEffect(() => {
    if (preferences) {
      setExcludedSectors(preferences.excluded_sectors || []);
      setPreferredSectors(preferences.preferred_sectors || []);
      setAdditionalCriteria(preferences.additional_criteria || "");
    }
  }, [preferences, open]);

  const handleAddExcluded = () => {
    if (newSector.trim() && !excludedSectors.includes(newSector.trim())) {
      setExcludedSectors([...excludedSectors, newSector.trim()]);
      setNewSector("");
    }
  };

  const handleRemoveExcluded = (sector: string) => {
    setExcludedSectors(excludedSectors.filter((s) => s !== sector));
  };

  const handleAddPreferred = () => {
    if (newSector.trim() && !preferredSectors.includes(newSector.trim())) {
      setPreferredSectors([...preferredSectors, newSector.trim()]);
      setNewSector("");
    }
  };

  const handleRemovePreferred = (sector: string) => {
    setPreferredSectors(preferredSectors.filter((s) => s !== sector));
  };

  const handleSave = async () => {
    if (!portfolioId) return;

    try {
      await updatePreferences.mutateAsync({
        portfolioId,
        data: {
          excluded_sectors: excludedSectors,
          preferred_sectors: preferredSectors,
          additional_criteria: additionalCriteria,
        },
      });
      toast({
        title: "Preferências salvas",
        description: "Suas preferências foram atualizadas",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as preferências",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Personalize suas recomendações</DialogTitle>
          <DialogDescription>
            Configure suas preferências para receber recomendações mais alinhadas com você
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Setores que não quero investir</Label>
            <div className="flex gap-2">
              <Input
                value={newSector}
                onChange={(e) => setNewSector(e.target.value)}
                placeholder="Ex: mineração"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddExcluded();
                  }
                }}
              />
              <Button type="button" onClick={handleAddExcluded} variant="outline">
                Adicionar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {excludedSectors.map((sector) => (
                <Badge key={sector} variant="destructive" className="flex items-center gap-1">
                  {sector}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleRemoveExcluded(sector)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Setores que prefiro</Label>
            <div className="flex gap-2">
              <Input
                value={newSector}
                onChange={(e) => setNewSector(e.target.value)}
                placeholder="Ex: financeiro"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddPreferred();
                  }
                }}
              />
              <Button type="button" onClick={handleAddPreferred} variant="outline">
                Adicionar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {preferredSectors.map((sector) => (
                <Badge key={sector} variant="secondary" className="flex items-center gap-1">
                  {sector}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleRemovePreferred(sector)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Critérios adicionais (opcional)</Label>
            <Textarea
              value={additionalCriteria}
              onChange={(e) => setAdditionalCriteria(e.target.value)}
              placeholder="Descreva critérios adicionais em texto livre..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={updatePreferences.isPending}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}




/** Componente para visualizar e editar estratégia da carteira. */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useStrategy, useUpdateStrategy } from "../hooks/use-investments";
import { useToast } from "@/stores/toast-store";

interface StrategyViewProps {
  portfolioId: string;
}

export function StrategyView({ portfolioId }: StrategyViewProps) {
  const { t } = useTranslation(["investments", "common"]);
  const { toast } = useToast();
  const { data: strategy, isLoading } = useStrategy(portfolioId);
  const updateStrategy = useUpdateStrategy();
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState("");

  const handleStartEdit = () => {
    if (strategy) {
      setEditedText(strategy.raw_text || "");
      setIsEditing(true);
    } else {
      toast({
        title: t("common:errors.error"),
        description: "Estratégia não encontrada",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedText("");
  };

  const handleSave = async () => {
    if (!strategy || !editedText.trim()) {
      toast({
        title: t("common:errors.error"),
        description: "Estratégia não pode estar vazia",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateStrategy.mutateAsync({
        id: strategy.id,
        data: { raw_text: editedText.trim() },
      });
      setIsEditing(false);
      toast({
        title: t("common:messages.success"),
        description: t("investments:toasts.update_success"),
      });
    } catch (error: any) {
      toast({
        title: t("common:errors.error"),
        description: error.message || t("investments:toasts.update_error"),
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("investments:fields.strategy")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t("common:messages.loading")}</p>
        </CardContent>
      </Card>
    );
  }

  if (!strategy) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("investments:fields.strategy")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t("investments:messages.no_strategy")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t("investments:fields.strategy")}</CardTitle>
          <div className="flex items-center gap-2">
            {strategy.strategy_type && (
              <Badge variant="secondary">
                {strategy.strategy_type_display || strategy.strategy_type}
              </Badge>
            )}
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartEdit}
              >
                <Pencil className="h-4 w-4 mr-2" />
                {t("common:actions.edit")}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="strategy-edit">{t("investments:fields.strategy")}</Label>
              <Textarea
                id="strategy-edit"
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={6}
                placeholder={t("investments:placeholders.strategy")}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                disabled={updateStrategy.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                {t("common:actions.cancel")}
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateStrategy.isPending || !editedText.trim()}
              >
                <Save className="h-4 w-4 mr-2" />
                {updateStrategy.isPending ? t("common:messages.loading") : t("common:actions.save")}
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-sm whitespace-pre-wrap">{strategy.raw_text || t("investments:messages.no_strategy")}</p>
            {strategy.parsed_rules?.criteria && Object.keys(strategy.parsed_rules.criteria).length > 0 && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-xs font-medium mb-2">{t("investments:strategy.parsed_criteria")}</p>
                <div className="space-y-1 text-xs">
                  {strategy.parsed_rules.criteria.dividend_yield_min && (
                    <p>DY mínimo: {(strategy.parsed_rules.criteria.dividend_yield_min * 100).toFixed(1)}%</p>
                  )}
                  {strategy.parsed_rules.criteria.pe_ratio_max && (
                    <p>P/L máximo: {strategy.parsed_rules.criteria.pe_ratio_max}</p>
                  )}
                  {strategy.parsed_rules.criteria.price_to_book_max && (
                    <p>P/VP máximo: {strategy.parsed_rules.criteria.price_to_book_max}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


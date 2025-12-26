/** Bloco de status da carteira com alertas. */

import { useTranslation } from "react-i18next";
import { CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import type { PortfolioStatus } from "../hooks/use-investments";

interface StatusBlockProps {
  status: PortfolioStatus | undefined;
  loading?: boolean;
}

export function StatusBlock({ status, loading }: StatusBlockProps) {
  const { t } = useTranslation(["investments"]);
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("investments:blocks.status.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return null;
  }

  const isOk = status.status === "ok";
  const hasAlerts = status.alerts && status.alerts.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t("investments:blocks.status.title")}</CardTitle>
          {hasAlerts && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          {isOk ? (
            <>
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <p className="text-lg font-medium">{t("investments:blocks.status.ok_message")}</p>
            </>
          ) : (
            <>
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              <p className="text-lg font-medium">
                {t("investments:blocks.status.attention_message", {
                  count: status.total_alerts || status.alerts.length,
                })}
              </p>
            </>
          )}
        </div>

        {hasAlerts && expanded && (
          <div className="space-y-2 pt-4 border-t">
            {status.alerts.map((alert, index) => (
              <div key={index} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline">{alert.ticker}</Badge>
                  <Badge variant="secondary">{alert.type}</Badge>
                </div>
                <p className="text-sm">{alert.message}</p>
                {alert.current !== undefined && alert.required !== undefined && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Atual: {alert.current.toFixed(2)} | Requerido: {alert.required.toFixed(2)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}




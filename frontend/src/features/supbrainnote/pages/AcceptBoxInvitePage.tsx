/** Página para aceitar convite de caixinha. */

import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { apiClient } from "@/config/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import { useState } from "react";

export default function AcceptBoxInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");
  const [boxName, setBoxName] = useState<string>("");

  useEffect(() => {
    const acceptInvite = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Token não fornecido");
        toast({
          title: "Erro",
          description: "Token de convite não encontrado.",
          variant: "destructive",
        });
        setTimeout(() => navigate("/supbrainnote"), 3000);
        return;
      }

      try {
        const response = await apiClient.post("/supbrainnote/invites/accept/", { token });
        setStatus("success");
        setMessage("Convite aceito com sucesso!");
        setBoxName(response.data.box_name || "");
        toast({
          title: "Sucesso",
          description: `Você agora tem acesso à caixinha "${response.data.box_name}".`,
        });
        setTimeout(() => navigate("/supbrainnote"), 3000);
      } catch (error: any) {
        setStatus("error");
        const errorMessage =
          error.response?.data?.error ||
          error.response?.data?.detail ||
          error.message ||
          "Não foi possível aceitar o convite.";
        setMessage(errorMessage);
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive",
        });
        setTimeout(() => navigate("/supbrainnote"), 5000);
      }
    };

    acceptInvite();
  }, [token, navigate]);

  return (
    <>
      <SEO
        title="Aceitar Convite de Caixinha"
        description="Aceite o convite para compartilhar uma caixinha"
        keywords="convite, caixinha, compartilhar"
        noindex={true}
      />
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Convite de Caixinha</CardTitle>
            <CardDescription>
              {status === "loading" && "Processando convite..."}
              {status === "success" && "Convite aceito com sucesso!"}
              {status === "error" && "Erro ao processar convite"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === "loading" && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">Aceitando convite...</p>
              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center justify-center py-8">
                <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
                <p className="text-sm font-medium mb-2">Convite aceito!</p>
                {boxName && (
                  <p className="text-sm text-muted-foreground mb-4">
                    Você agora tem acesso à caixinha <strong>"{boxName}"</strong>.
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Redirecionando para SupBrainNote...
                </p>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center justify-center py-8">
                <XCircle className="w-12 h-12 text-destructive mb-4" />
                <p className="text-sm font-medium mb-2">Erro ao aceitar convite</p>
                <p className="text-sm text-muted-foreground text-center mb-4">{message}</p>
                <Button onClick={() => navigate("/supbrainnote")} variant="outline">
                  Ir para SupBrainNote
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}


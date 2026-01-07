/** Página para aceitar convite de caixinha. */

import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiClient } from "@/config/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, LogIn, UserPlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/stores/auth-store";

interface InviteInfo {
  valid: boolean;
  email: string;
  box_id: string;
  box_name: string;
  permission: string;
  inviter_name: string;
  inviter_email: string;
  user_exists: boolean;
  expires_at: string;
}

export default function AcceptBoxInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"verifying" | "loading" | "success" | "error" | "needs-auth">("verifying");
  const [message, setMessage] = useState<string>("");
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [boxName, setBoxName] = useState<string>("");

  // Verificar token primeiro (sem autenticação)
  useEffect(() => {
    const verifyToken = async () => {
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
        // Verificar token sem autenticação
        const response = await apiClient.get<InviteInfo>("/supbrainnote/invites/verify/", {
          params: { token },
        });

        setInviteInfo(response.data);
        setBoxName(response.data.box_name);

        // Se token válido, verificar se usuário está autenticado
        if (user) {
          // Usuário autenticado - verificar se email corresponde
          if (user.email.toLowerCase() !== response.data.email.toLowerCase()) {
            setStatus("error");
            setMessage(`Este convite foi enviado para ${response.data.email}, mas você está logado como ${user.email}.`);
            toast({
              title: "Erro",
              description: "Este convite foi enviado para outro email.",
              variant: "destructive",
            });
            setTimeout(() => navigate("/supbrainnote"), 5000);
            return;
          }

          // Email corresponde - aceitar convite
          acceptInvite();
        } else {
          // Usuário não autenticado - mostrar opções
          setStatus("needs-auth");
        }
      } catch (error: any) {
        setStatus("error");
        const errorMessage =
          error.response?.data?.error ||
          error.response?.data?.detail ||
          error.message ||
          "Token de convite inválido ou expirado.";
        setMessage(errorMessage);
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive",
        });
        setTimeout(() => navigate("/supbrainnote"), 5000);
      }
    };

    verifyToken();
  }, [token, navigate]);

  // Aceitar convite (requer autenticação)
  const acceptInvite = async () => {
    if (!token) return;

    setStatus("loading");
    try {
      const response = await apiClient.post("/supbrainnote/invites/accept/", { token });
      setStatus("success");
      setMessage("Convite aceito com sucesso!");
      setBoxName(response.data.box_name || inviteInfo?.box_name || "");
      toast({
        title: "Sucesso",
        description: `Você agora tem acesso à caixinha "${response.data.box_name || inviteInfo?.box_name}".`,
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

  // Tentar aceitar novamente após login (quando user mudar)
  useEffect(() => {
    if (user && inviteInfo && status === "needs-auth") {
      // Verificar se email corresponde
      if (user.email.toLowerCase() === inviteInfo.email.toLowerCase()) {
        acceptInvite();
      } else {
        setStatus("error");
        setMessage(`Este convite foi enviado para ${inviteInfo.email}, mas você está logado como ${user.email}.`);
        toast({
          title: "Erro",
          description: "Este convite foi enviado para outro email.",
          variant: "destructive",
        });
      }
    }
  }, [user, inviteInfo, status]);

  // Deep link para app mobile (opcional)
  const handleDeepLink = () => {
    if (!token || !inviteInfo) return;

    // Tentar abrir app mobile com deep link
    // Formato: app://accept-box-invite?token=xxx
    const deepLink = `app://accept-box-invite?token=${token}`;

    // Tentar abrir app
    window.location.href = deepLink;

    // Fallback: se app não abrir em 2 segundos, continuar no web
    setTimeout(() => {
      // App não abriu, continuar no web
    }, 2000);
  };

  const getLoginUrl = () => {
    const redirect = `/accept-box-invite?token=${token}`;
    return `/login?redirect=${encodeURIComponent(redirect)}`;
  };

  const getRegisterUrl = () => {
    const redirect = `/accept-box-invite?token=${token}`;
    return `/register?redirect=${encodeURIComponent(redirect)}&email=${encodeURIComponent(inviteInfo?.email || "")}`;
  };

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
              {status === "verifying" && "Verificando convite..."}
              {status === "loading" && "Aceitando convite..."}
              {status === "success" && "Convite aceito com sucesso!"}
              {status === "error" && "Erro ao processar convite"}
              {status === "needs-auth" && "Autenticação necessária"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === "verifying" && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">Verificando convite...</p>
              </div>
            )}

            {status === "needs-auth" && inviteInfo && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <p className="text-sm font-medium mb-2">
                    {inviteInfo.inviter_name} compartilhou a caixinha
                  </p>
                  <p className="text-lg font-semibold mb-2">"{inviteInfo.box_name}"</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    com você ({inviteInfo.email})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Para aceitar este convite, você precisa estar autenticado.
                  </p>
                </div>

                <div className="space-y-2">
                  {inviteInfo.user_exists ? (
                    <>
                      <Button
                        asChild
                        className="w-full"
                        onClick={() => navigate(getLoginUrl())}
                      >
                        <Link to={getLoginUrl()}>
                          <LogIn className="w-4 h-4 mr-2" />
                          Fazer Login
                        </Link>
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        Já tem uma conta? Faça login para aceitar o convite.
                      </p>
                    </>
                  ) : (
                    <>
                      <Button
                        asChild
                        className="w-full"
                        onClick={() => navigate(getRegisterUrl())}
                      >
                        <Link to={getRegisterUrl()}>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Criar Conta
                        </Link>
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        Crie uma conta gratuita para aceitar este convite.
                      </p>
                    </>
                  )}
                </div>

                {/* Opção de deep link para app mobile (opcional) */}
                {typeof window !== "undefined" && (
                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleDeepLink}
                    >
                      Abrir no App Mobile
                    </Button>
                  </div>
                )}
              </div>
            )}

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
                <p className="text-sm font-medium mb-2">Erro ao processar convite</p>
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

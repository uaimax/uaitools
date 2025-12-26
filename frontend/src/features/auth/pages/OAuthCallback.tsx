import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/features/auth/hooks/use-auth-queries';
import { SEO } from '@/components/SEO';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refetch: refetchProfile } = useProfile();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      const token = searchParams.get('token');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError(errorParam);
        setLoading(false);
        return;
      }

      if (token) {
        try {
          localStorage.setItem('access_token', token);
          await refetchProfile();
          navigate('/admin/dashboard');
        } catch (err) {
          console.error('Erro ao processar callback:', err);
          setError('Erro ao processar autenticação. Tente novamente.');
          setLoading(false);
        }
      } else {
        setError('Token não recebido do servidor.');
        setLoading(false);
      }
    };

    processCallback();
  }, [searchParams, navigate, refetchProfile]);

  if (loading) {
    return (
      <>
        <SEO
          title="Processando autenticação..."
          description="Aguarde enquanto finalizamos seu login."
          noindex={true}
        />
        <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Processando autenticação...</CardTitle>
            <CardDescription>
              Aguarde enquanto finalizamos seu login.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <SEO
          title="Erro na autenticação"
          description="Ocorreu um erro ao processar o login social."
          noindex={true}
        />
        <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Erro na autenticação</CardTitle>
            <CardDescription>
              Ocorreu um erro ao processar o login social.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={() => navigate('/login')} className="w-full">
              Voltar para Login
            </Button>
          </CardContent>
        </Card>
      </div>
      </>
    );
  }

  return null;
}

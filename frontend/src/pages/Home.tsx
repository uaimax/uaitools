import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Server, Database, Shield, Code, Zap } from "lucide-react"
import { useTranslation } from "react-i18next"
import { apiClient } from "@/config/api"
import { useAuth } from "@/stores/auth-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SEO } from "@/components/SEO"

interface HealthCheck {
  status: string
  version: string
  api_prefix: string
}

export default function Home() {
  const { t } = useTranslation(["seo", "common"])
  const { user } = useAuth()
  const [health, setHealth] = useState<HealthCheck | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await apiClient.get("/health/")
        setHealth(response.data)
        setError(null)
      } catch (err) {
        setError("Erro ao conectar com a API")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    checkHealth()
  }, [])

  const features = [
    { icon: Server, title: "Backend Django 5 + DRF", description: "API REST completa e robusta" },
    { icon: Database, title: "Multi-tenancy", description: "Isolamento de dados por tenant" },
    { icon: Shield, title: "Auditoria LGPD", description: "Conformidade desde o dia zero" },
    { icon: Code, title: "React + TypeScript", description: "Frontend moderno e type-safe" },
    { icon: Zap, title: "Tailwind CSS", description: "Estilização direta e customizável" },
  ]

  return (
    <>
      <SEO
        title={t("seo:home.title")}
        description={t("seo:home.description")}
        keywords="SaaS, CRM, gerenciamento de negócios, plataforma SaaS, multi-tenancy"
      />
      <div className="space-y-12 py-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          SaaS Bootstrap
        </h1>
        <p className="mx-auto max-w-[700px] text-lg text-muted-foreground sm:text-xl">
          Template completo para lançamento rápido de MicroSaaS com multi-tenancy,
          autenticação e admin UI kit.
        </p>
        {!user && (
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button asChild>
              <Link to="/register">Começar Agora</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/login">Fazer Login</Link>
            </Button>
          </div>
        )}
        {user && (
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button asChild>
              <Link to="/admin/dashboard">Acessar Dashboard</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Health Check */}
      <Card>
        <CardHeader>
          <CardTitle>Status da API</CardTitle>
          <CardDescription>Verificação de conexão com o backend</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-muted-foreground">Verificando...</p>}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          {health && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <span className="text-sm">{health.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Versão:</span>
                <span className="text-sm">{health.version}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Prefix:</span>
                <span className="text-sm">{health.api_prefix}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Features */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <feature.icon className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{feature.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
    </>
  )
}

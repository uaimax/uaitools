import { useState } from "react"
import { useTranslation } from "react-i18next"
import { MainLayout } from "../components/layout/MainLayout"
import { Breadcrumbs } from "../components/layout/Breadcrumbs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAuthStore } from "@/stores/auth-store"
import { useWorkspace } from "../hooks/useWorkspace"
import { WorkspaceSelector } from "../components/layout/TenantSelector"
import { useToast } from "@/stores/toast-store"
import { useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/config/api"
import { Save, User, Building2, Bell, Shield } from "lucide-react"
import { SEO } from "@/components/SEO"

export default function SettingsPage() {
  const { t } = useTranslation(["seo"])
  const user = useAuthStore((state) => state.user)
  const { workspace, workspaceName } = useWorkspace()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      await apiClient.patch("/auth/profile/update/", formData)
      // Invalidar query de perfil para refetch
      await queryClient.invalidateQueries({ queryKey: ["auth", "profile"] })
      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso.",
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.detail || "Erro ao atualizar perfil.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <SEO
        title={t("seo:settings.title")}
        description={t("seo:settings.description")}
        keywords="configurações, perfil, workspace, conta"
        noindex={true}
      />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Configurações" },
            ]}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Perfil do Usuário */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <CardTitle>Perfil do Usuário</CardTitle>
              </div>
              <CardDescription>Atualize suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Nome</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Sobrenome</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Informações do Workspace */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <CardTitle>Workspace</CardTitle>
              </div>
              <CardDescription>Informações do seu workspace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Workspace</Label>
                <Input value={workspaceName || "-"} disabled />
              </div>
              {workspace && (
                <>
                  <div className="space-y-2">
                    <Label>ID do Workspace</Label>
                    <Input value={workspace.id.toString()} disabled />
                  </div>
                  {workspace.slug && (
                    <div className="space-y-2">
                      <Label>Slug</Label>
                      <Input value={workspace.slug} disabled />
                    </div>
                  )}
                </>
              )}
              <Separator />
              <div>
                <Label className="mb-2 block">Trocar Workspace</Label>
                <WorkspaceSelector />
              </div>
            </CardContent>
          </Card>

          {/* Notificações */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <CardTitle>Notificações</CardTitle>
              </div>
              <CardDescription>Configure suas preferências de notificação</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                As configurações de notificação estarão disponíveis em breve.
              </p>
            </CardContent>
          </Card>

          {/* Segurança */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <CardTitle>Segurança</CardTitle>
              </div>
              <CardDescription>Gerencie sua segurança e privacidade</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                As configurações de segurança estarão disponíveis em breve.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}

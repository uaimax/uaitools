import { useTranslation } from "react-i18next"
import { MainLayout } from "../components/layout/MainLayout"
import { Breadcrumbs } from "../components/layout/Breadcrumbs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useDashboardStats } from "../hooks/use-dashboard"
import { Users, TrendingUp, FileText, Activity } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { SEO } from "@/components/SEO"

export default function DashboardPage() {
  const { t } = useTranslation(["common", "seo"])
  const { data: stats, isLoading: loading, error: queryError } = useDashboardStats()
  const error = queryError ? (queryError as any).response?.data?.detail || t("common:dashboard.error_loading_stats") : null

  const statCards = [
    {
      title: t("common:dashboard.total_leads"),
      value: stats?.total_leads ?? 0,
      description: t("common:dashboard.leads_registered"),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: t("common:dashboard.new_leads"),
      value: stats?.new_leads ?? 0,
      description: t("common:dashboard.last_30_days"),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: t("common:dashboard.converted"),
      value: stats?.converted_leads ?? 0,
      description: t("common:dashboard.leads_converted"),
      icon: Activity,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: t("common:dashboard.documents"),
      value: "-",
      description: t("common:dashboard.coming_soon"),
      icon: FileText,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    },
  ]

  return (
    <MainLayout>
      <SEO
        title={t("seo:dashboard.title")}
        description={t("seo:dashboard.description")}
        keywords="dashboard, painel administrativo, estatísticas, leads, negócios"
        noindex={true}
      />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t("common:dashboard.title")}</h1>
            <Breadcrumbs items={[{ label: t("common:dashboard.title") }]} />
          </div>
          <Button asChild>
            <Link to="/admin/leads/new">{t("common:dashboard.new_lead")}</Link>
          </Button>
        </div>

        {error && !loading && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <div className={`rounded-full p-2 ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <div className="text-2xl font-bold">{stat.value}</div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("common:dashboard.quick_actions")}</CardTitle>
              <CardDescription>{t("common:dashboard.quick_actions_description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/admin/leads">
                  <Users className="mr-2 h-4 w-4" />
                  {t("common:dashboard.view_all_leads")}
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/admin/leads/new">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  {t("common:dashboard.create_new_lead")}
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/admin/settings">
                  <Activity className="mr-2 h-4 w-4" />
                  {t("common:dashboard.settings")}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("common:dashboard.welcome")}</CardTitle>
              <CardDescription>{t("common:dashboard.welcome_description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("common:dashboard.welcome_text")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}

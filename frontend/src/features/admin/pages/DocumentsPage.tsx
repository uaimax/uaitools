import { useTranslation } from "react-i18next"
import { MainLayout } from "../components/layout/MainLayout"
import { Breadcrumbs } from "../components/layout/Breadcrumbs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"
import { SEO } from "@/components/SEO"

export default function DocumentsPage() {
  const { t } = useTranslation(["seo"])

  return (
    <MainLayout>
      <SEO
        title={t("seo:documents.title")}
        description={t("seo:documents.description")}
        keywords="documentos, contratos, termos, política de privacidade"
        noindex={true}
      />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Documentos</h1>
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Documentos" },
            ]}
          />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle>Documentos</CardTitle>
            </div>
            <CardDescription>Gerenciamento de documentos</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              A funcionalidade de gerenciamento de documentos estará disponível em breve.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}



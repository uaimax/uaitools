import { useTranslation } from "react-i18next"
import { ResourceListPage } from "../components/resources/ResourceListPage"
import { getLeadResource } from "@/config/resources/leads"
import { SEO } from "@/components/SEO"

export default function LeadsPage() {
  const { t } = useTranslation(["seo"])
  const leadResource = getLeadResource()

  return (
    <>
      <SEO
        title={t("seo:leads.list.title")}
        description={t("seo:leads.list.description")}
        keywords="leads, lista de leads, gerenciamento de leads, CRM"
        noindex={true}
      />
      <ResourceListPage config={leadResource} />
    </>
  )
}


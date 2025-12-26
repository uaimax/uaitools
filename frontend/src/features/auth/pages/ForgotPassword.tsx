import { useTranslation } from "react-i18next"
import { ForgotPasswordForm } from "../components/forgot-password-form"
import { SEO } from "@/components/SEO"

export default function ForgotPassword() {
  const { t } = useTranslation(["seo"])

  return (
    <>
      <SEO
        title={t("seo:forgot_password.title")}
        description={t("seo:forgot_password.description")}
        keywords="recuperar senha, esqueci senha, reset password"
        noindex={true}
      />
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <div className="w-full max-w-md">
          <ForgotPasswordForm />
        </div>
      </div>
    </>
  )
}



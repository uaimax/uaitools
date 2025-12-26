import { useTranslation } from "react-i18next"
import { ResetPasswordForm } from "../components/reset-password-form"
import { SEO } from "@/components/SEO"

export default function ResetPassword() {
  const { t } = useTranslation(["seo"])

  return (
    <>
      <SEO
        title={t("seo:reset_password.title")}
        description={t("seo:reset_password.description")}
        keywords="redefinir senha, nova senha, reset password"
        noindex={true}
      />
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <div className="w-full max-w-md">
          <ResetPasswordForm />
        </div>
      </div>
    </>
  )
}



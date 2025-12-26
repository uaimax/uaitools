/** Página de login. */

import { useTranslation } from "react-i18next"
import { LoginForm } from "@/features/auth/components/login-form"
import { SEO } from "@/components/SEO"

export default function Login() {
  const { t } = useTranslation(["seo"])

  return (
    <>
      <SEO
        title={t("seo:login.title")}
        description={t("seo:login.description")}
        keywords="login, autenticação, acesso, conta"
        noindex={true}
      />
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </>
  )
}

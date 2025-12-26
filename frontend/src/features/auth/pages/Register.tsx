/** Página de registro. */

import { useTranslation } from "react-i18next"
import { RegisterForm } from "@/features/auth/components/register-form"
import { SEO } from "@/components/SEO"

export default function Register() {
  const { t } = useTranslation(["seo"])

  return (
    <>
      <SEO
        title={t("seo:register.title")}
        description={t("seo:register.description")}
        keywords="registro, criar conta, cadastro, sign up"
      />
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <RegisterForm />
        </div>
      </div>
    </>
  )
}

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useNavigate, Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useLoginMutation } from "../hooks/use-auth-queries"
import { useToast } from "@/stores/toast-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSocialProviders } from "../hooks/useSocialProviders"
import { SocialButton } from "@/components/ui/social-button"
import { getZodMessages } from "@/i18n/zod"

export function LoginForm() {
  const { t } = useTranslation(["auth", "common"])
  const navigate = useNavigate()
  const loginMutation = useLoginMutation()
  const { toast } = useToast()
  const { data: providers = [], isLoading: providersLoading } = useSocialProviders()

  // Criar schema dentro do componente para ter acesso às traduções
  const zodMessages = getZodMessages()
  const loginSchema = z.object({
    email: z.string().email(zodMessages.invalidEmail()).min(1, zodMessages.required()),
    password: z.string().min(1, zodMessages.required()),
  })

  type LoginFormValues = z.infer<typeof loginSchema>

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await loginMutation.mutateAsync({ email: data.email, password: data.password })
      toast({
        title: t("auth:toasts.login_success"),
        variant: "default",
      })
      navigate("/admin/dashboard")
    } catch (error: any) {
      toast({
        title: t("auth:toasts.login_error"),
        description: error.response?.data?.detail || error.message || t("auth:messages.invalid_credentials"),
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("auth:title.login")}</CardTitle>
        <CardDescription>{t("auth:descriptions.login")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth:fields.email")}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="seu@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>{t("auth:fields.password")}</FormLabel>
                    <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                      {t("auth:links.forgot_password")}
                    </Link>
                  </div>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || loginMutation.isPending}>
              {form.formState.isSubmitting || loginMutation.isPending
                ? t("auth:loading.logging_in")
                : t("auth:buttons.login")}
            </Button>
          </form>
        </Form>

        {!providersLoading && providers.length > 0 && (
          <>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t("auth:links.or_continue_with")}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {providers.map((provider) => (
                <SocialButton
                  key={provider.provider}
                  provider={provider.provider}
                  name={provider.name}
                />
              ))}
            </div>
          </>
        )}

        <div className="mt-4 text-center text-sm">
          <span className="text-muted-foreground">{t("auth:links.no_account")} </span>
          <Link to="/register" className="text-primary hover:underline">
            {t("auth:links.register")}
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

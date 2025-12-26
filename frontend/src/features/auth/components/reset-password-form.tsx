import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { usePasswordResetConfirmMutation } from "../hooks/use-auth-queries"
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
import { getZodMessages } from "@/i18n/zod"
import { useEffect } from "react"

export function ResetPasswordForm() {
  const { t } = useTranslation(["auth", "common"])
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const resetMutation = usePasswordResetConfirmMutation()
  const { toast } = useToast()

  const token = searchParams.get("token")

  const zodMessages = getZodMessages()
  const resetPasswordSchema = z
    .object({
      new_password: z.string().min(8, zodMessages.passwordMin(8)).min(1, zodMessages.required()),
      confirm_password: z.string().min(1, zodMessages.required()),
    })
    .refine((data) => data.new_password === data.confirm_password, {
      message: t("auth:validation.passwords_mismatch"),
      path: ["confirm_password"],
    })

  type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      new_password: "",
      confirm_password: "",
    },
  })

  useEffect(() => {
    if (!token) {
      toast({
        title: t("auth:reset_password.errors.invalid_token"),
        description: t("auth:reset_password.errors.invalid_token"),
        variant: "destructive",
      })
      // Pequeno delay para mostrar o toast antes de navegar
      setTimeout(() => {
        navigate("/forgot-password")
      }, 2000)
    }
  }, [token, navigate, toast, t])

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      toast({
        title: t("auth:reset_password.errors.invalid_token"),
        variant: "destructive",
      })
      return
    }

    try {
      await resetMutation.mutateAsync({
        token,
        new_password: data.new_password,
      })
      toast({
        title: t("auth:toasts.reset_password_success"),
        variant: "default",
      })
      navigate("/login")
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.token?.[0] ||
        error.response?.data?.detail ||
        error.message ||
        t("auth:toasts.reset_password_error")

      toast({
        title: t("auth:toasts.reset_password_error"),
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  if (!token) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t("auth:title.reset_password")}</CardTitle>
          <CardDescription>{t("auth:reset_password.errors.invalid_token")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {t("auth:reset_password.errors.invalid_token")}
          </p>
          <Button
            onClick={() => navigate("/forgot-password")}
            className="w-full"
          >
            {t("auth:links.forgot_password")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("auth:title.reset_password")}</CardTitle>
        <CardDescription>{t("auth:descriptions.reset_password")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="new_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth:fields.password")}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirm_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth:fields.confirm_password")}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting || resetMutation.isPending}
            >
              {form.formState.isSubmitting || resetMutation.isPending
                ? t("auth:loading.resetting")
                : t("auth:title.reset_password")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}


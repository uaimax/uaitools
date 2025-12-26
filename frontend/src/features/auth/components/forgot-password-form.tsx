import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { usePasswordResetRequestMutation } from "../hooks/use-auth-queries"
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

export function ForgotPasswordForm() {
  const { t } = useTranslation(["auth", "common"])
  const resetMutation = usePasswordResetRequestMutation()
  const { toast } = useToast()

  const zodMessages = getZodMessages()
  const forgotPasswordSchema = z.object({
    email: z.string().email(zodMessages.invalidEmail()).min(1, zodMessages.required()),
  })

  type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      await resetMutation.mutateAsync({ email: data.email })
      toast({
        title: t("auth:toasts.forgot_password_success"),
        variant: "default",
      })
      form.reset()
    } catch (error: any) {
      toast({
        title: t("auth:toasts.forgot_password_error"),
        description: error.response?.data?.detail || error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("auth:title.forgot_password")}</CardTitle>
        <CardDescription>{t("auth:descriptions.forgot_password")}</CardDescription>
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
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting || resetMutation.isPending}
            >
              {form.formState.isSubmitting || resetMutation.isPending
                ? t("auth:loading.sending_reset")
                : t("auth:buttons.forgot_password")}
            </Button>
          </form>
        </Form>

        <div className="mt-4 text-center text-sm">
          <Link to="/login" className="text-primary hover:underline">
            {t("auth:links.back_to_login")}
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}



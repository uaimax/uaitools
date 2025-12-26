import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useNavigate, Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useRegisterMutation } from "../hooks/use-auth-queries"
import { useToast } from "@/stores/toast-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Controller } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSocialProviders } from "../hooks/useSocialProviders"
import { SocialButton } from "@/components/ui/social-button"
import { useState } from "react"
import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getTerms, getPrivacyPolicy } from "@/features/legal/services/legal"
import ReactMarkdown from "react-markdown"
import { getZodMessages } from "@/i18n/zod"

export function RegisterForm() {
  const { t } = useTranslation(["auth", "common"])
  const navigate = useNavigate()
  const registerMutation = useRegisterMutation()
  const { toast } = useToast()
  const { data: providers = [], isLoading: providersLoading } = useSocialProviders()
  const [termsOpen, setTermsOpen] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [termsContent, setTermsContent] = useState("")
  const [privacyContent, setPrivacyContent] = useState("")

  // Criar schema dentro do componente para ter acesso às traduções
  const zodMessages = getZodMessages()
  const registerSchema = z
    .object({
      email: z.string().email(zodMessages.invalidEmail()).min(1, zodMessages.required()),
      password: z.string().min(8, zodMessages.minLength(8)),
      password_confirm: z.string().min(8, zodMessages.required()),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      workspace_name: z.string().optional(),
      accepted_terms: z.boolean().refine((val) => val === true, {
        message: t("auth:validation.accept_terms"),
      }),
      accepted_privacy: z.boolean().refine((val) => val === true, {
        message: t("auth:validation.accept_privacy"),
      }),
    })
    .refine((data) => data.password === data.password_confirm, {
      message: zodMessages.passwordMismatch(),
      path: ["password_confirm"],
    })

  type RegisterFormValues = z.infer<typeof registerSchema>

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      password_confirm: "",
      first_name: "",
      last_name: "",
      workspace_name: "",
      accepted_terms: false,
      accepted_privacy: false,
    },
  })

  const loadTerms = async () => {
    try {
      console.log("Carregando termos...")
      setTermsOpen(true)
      console.log("Dialog aberto, aguardando conteúdo...")
      const data = await getTerms()
      console.log("Termos carregados:", data)
      setTermsContent(data.content)
    } catch (error: any) {
      console.error("Erro ao carregar termos:", error)
      setTermsOpen(false)
      toast({
        title: t("common:errors.error"),
        description: error.response?.data?.detail || t("common:errors.unknown"),
        variant: "destructive",
      })
    }
  }

  const loadPrivacy = async () => {
    try {
      console.log("Carregando política...")
      setPrivacyOpen(true)
      console.log("Dialog aberto, aguardando conteúdo...")
      const data = await getPrivacyPolicy()
      console.log("Política carregada:", data)
      setPrivacyContent(data.content)
    } catch (error: any) {
      console.error("Erro ao carregar política:", error)
      setPrivacyOpen(false)
      toast({
        title: t("common:errors.error"),
        description: error.response?.data?.detail || t("common:errors.unknown"),
        variant: "destructive",
      })
    }
  }

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      // Remover campos opcionais vazios antes de enviar
      const payload: any = {
        email: data.email,
        password: data.password,
        password_confirm: data.password_confirm,
        accepted_terms: data.accepted_terms,
        accepted_privacy: data.accepted_privacy,
      };

      // Adicionar campos opcionais apenas se não estiverem vazios
      if (data.first_name?.trim()) {
        payload.first_name = data.first_name.trim();
      }
      if (data.last_name?.trim()) {
        payload.last_name = data.last_name.trim();
      }
      if (data.workspace_name?.trim()) {
        payload.workspace_name = data.workspace_name.trim();
      }

      await registerMutation.mutateAsync(payload);
      toast({
        title: t("auth:toasts.register_success"),
        variant: "default",
      });
      navigate("/admin/dashboard");
    } catch (error: any) {
      toast({
        title: t("auth:toasts.register_error"),
        description: error.response?.data?.detail || error.message || t("common:errors.unknown"),
        variant: "destructive",
      });
    }
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t("auth:title.register")}</CardTitle>
          <CardDescription>{t("auth:descriptions.register")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("auth:fields.first_name")}</FormLabel>
                      <FormControl>
                        <Input placeholder="João" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("auth:fields.last_name")}</FormLabel>
                      <FormControl>
                        <Input placeholder="Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                name="workspace_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth:fields.workspace_name")} ({t("common:labels.optional")})</FormLabel>
                    <FormControl>
                      <Input placeholder="Minha Empresa" {...field} />
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
                name="password_confirm"
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
              <div className="space-y-3">
                <Controller
                  control={form.control}
                  name="accepted_terms"
                  render={({ field }) => {
                    const checkboxId = `accepted_terms-${React.useId()}`;
                    return (
                      <div className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                        <div className="flex-shrink-0 pt-0.5">
                          <Checkbox
                            id={checkboxId}
                            checked={field.value ?? false}
                            onCheckedChange={(checked) => field.onChange(checked)}
                          />
                        </div>
                        <div className="space-y-1 leading-none flex-1">
                          <label
                            htmlFor={checkboxId}
                            className="cursor-pointer text-sm font-normal leading-relaxed"
                            onClick={(e) => {
                              // Permitir que o label marque/desmarque o checkbox
                              if (e.target instanceof HTMLButtonElement) {
                                return; // Não fazer nada se clicar no botão de link
                              }
                              field.onChange(!field.value);
                            }}
                          >
                            <span>
                              {t("auth:validation.accept_terms_prefix", { defaultValue: "Eu aceito e concordo com os " })}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  loadTerms();
                                }}
                                className="text-primary underline font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-1"
                              >
                                {t("auth:links.terms", { defaultValue: "Termos e Condições de Uso" })}
                              </button>
                              {t("auth:validation.accept_terms_suffix", { defaultValue: " desta plataforma." })}
                            </span>
                          </label>
                          {form.formState.errors.accepted_terms && (
                            <p className="text-sm font-medium text-destructive">
                              {form.formState.errors.accepted_terms.message}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  }}
                />
                <Controller
                  control={form.control}
                  name="accepted_privacy"
                  render={({ field }) => {
                    const checkboxId = `accepted_privacy-${React.useId()}`;
                    return (
                      <div className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                        <div className="flex-shrink-0 pt-0.5">
                          <Checkbox
                            id={checkboxId}
                            checked={field.value ?? false}
                            onCheckedChange={(checked) => field.onChange(checked)}
                          />
                        </div>
                        <div className="space-y-1 leading-none flex-1">
                          <label
                            htmlFor={checkboxId}
                            className="cursor-pointer text-sm font-normal leading-relaxed"
                            onClick={(e) => {
                              // Permitir que o label marque/desmarque o checkbox
                              if (e.target instanceof HTMLButtonElement) {
                                return; // Não fazer nada se clicar no botão de link
                              }
                              field.onChange(!field.value);
                            }}
                          >
                            <span>
                              {t("auth:validation.accept_privacy_prefix", { defaultValue: "Eu aceito e concordo com a " })}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  loadPrivacy();
                                }}
                                className="text-primary underline font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-1"
                              >
                                {t("auth:links.privacy", { defaultValue: "Política de Privacidade e Proteção de Dados (LGPD)" })}
                              </button>
                              {t("auth:validation.accept_privacy_suffix", { defaultValue: " desta plataforma." })}
                            </span>
                          </label>
                          {form.formState.errors.accepted_privacy && (
                            <p className="text-sm font-medium text-destructive">
                              {form.formState.errors.accepted_privacy.message}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  }}
                />
              </div>
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || registerMutation.isPending}>
                {form.formState.isSubmitting || registerMutation.isPending
                  ? t("auth:loading.registering")
                  : t("auth:buttons.register")}
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
            <span className="text-muted-foreground">{t("auth:links.has_account")} </span>
            <Link to="/login" className="text-primary hover:underline">
              {t("auth:links.login")}
            </Link>
          </div>
        </CardContent>
      </Card>

      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("auth:links.terms", { defaultValue: "Termos e Condições" })}</DialogTitle>
            <DialogDescription>
              {t("auth:descriptions.read_terms", { defaultValue: "Leia atentamente os termos e condições de uso." })}
            </DialogDescription>
          </DialogHeader>
          <div className="prose prose-sm max-w-none dark:prose-invert mt-4">
            {termsContent ? (
              <ReactMarkdown>{termsContent}</ReactMarkdown>
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">{t("common:messages.loading")}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("auth:links.privacy", { defaultValue: "Política de Privacidade (LGPD)" })}</DialogTitle>
            <DialogDescription>
              {t("auth:descriptions.read_privacy", { defaultValue: "Leia atentamente nossa política de privacidade e conformidade com a LGPD." })}
            </DialogDescription>
          </DialogHeader>
          <div className="prose prose-sm max-w-none dark:prose-invert mt-4">
            {privacyContent ? (
              <ReactMarkdown>{privacyContent}</ReactMarkdown>
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">{t("common:messages.loading")}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

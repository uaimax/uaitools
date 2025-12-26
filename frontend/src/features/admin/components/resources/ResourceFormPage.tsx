import { useEffect, useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MainLayout } from "../layout/MainLayout"
import { Breadcrumbs } from "../layout/Breadcrumbs"
import { FormField } from "../forms/FormField"
import { SubmitButton } from "../forms/SubmitButton"
import { useResource } from "@/features/admin/hooks/useResource"
import { createResourceSchema } from "@/lib/admin/resource-config"
import type { ResourceConfig } from "@/lib/admin/resource-config"
import { useToast } from "@/stores/toast-store"
import { Form } from "@/components/ui/form"

interface ResourceFormPageProps<T extends Record<string, any>> {
  config: ResourceConfig<T>
}

export function ResourceFormPage<T extends Record<string, any>>({
  config,
}: ResourceFormPageProps<T>) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = !!id
  const { toast } = useToast()

  // skipInitialFetch: true para não buscar todos os itens, só o específico quando editando
  const { getItem, create, update } = useResource<T>({
    resource: config,
    basePath: config.endpoint,
    skipInitialFetch: true,
  })

  const schema = createResourceSchema(config.fields)
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {} as any,
  })

  const [loadingItem, setLoadingItem] = useState(false)
  const hasFetchedRef = useRef<string | null>(null)
  const isResettingRef = useRef(false)
  const formInitializedRef = useRef(false)

  // Buscar item específico quando estiver editando
  // IMPORTANTE: Só executar uma vez por ID
  useEffect(() => {
    // Se não estiver editando, limpar refs e não fazer nada
    if (!isEditing || !id) {
      hasFetchedRef.current = null
      isResettingRef.current = false
      formInitializedRef.current = false
      return
    }

    // Se já buscou este ID específico, não buscar novamente
    if (hasFetchedRef.current === id && formInitializedRef.current) {
      return
    }

    // Marcar que está buscando
    hasFetchedRef.current = id
    isResettingRef.current = true
    formInitializedRef.current = false
    setLoadingItem(true)

    getItem(id)
      .then((item) => {
        // Só resetar se ainda for o mesmo ID e não estiver resetando
        if (hasFetchedRef.current === id && isResettingRef.current) {
          // Usar setTimeout para garantir que o reset acontece após o render
          setTimeout(() => {
            if (hasFetchedRef.current === id && isResettingRef.current) {
              form.reset(item as any, { keepDefaultValues: false })
              formInitializedRef.current = true
              isResettingRef.current = false
            }
          }, 0)
        }
      })
      .catch((error) => {
        console.error("Erro ao carregar item:", error)
        isResettingRef.current = false
        formInitializedRef.current = false
        toast({
          title: "Erro",
          description: error.message || "Não foi possível carregar o item para edição.",
          variant: "destructive",
        })
      })
      .finally(() => {
        // Só atualizar loading se ainda for o mesmo ID
        if (hasFetchedRef.current === id) {
          // Dar um pequeno delay para garantir que o reset foi aplicado
          setTimeout(() => {
            if (hasFetchedRef.current === id) {
              setLoadingItem(false)
            }
          }, 100)
        }
      })
  // Dependências mínimas - só id importa
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const onSubmit = async (data: any) => {
    try {
      if (isEditing) {
        await update(id!, data)
        toast({
          title: "Sucesso",
          description: `${config.name} atualizado com sucesso.`,
        })
      } else {
        await create(data)
        toast({
          title: "Sucesso",
          description: `${config.name} criado com sucesso.`,
        })
      }
      navigate(-1)
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || `Erro ao salvar ${config.name}.`,
        variant: "destructive",
      })
    }
  }

  const title = isEditing
    ? config.editTitle || `Editar ${config.name}`
    : config.createTitle || `Criar ${config.name}`

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <Breadcrumbs
              items={[
                { label: "Dashboard", href: "/admin/dashboard" },
                { label: config.listTitle || config.namePlural, href: config.endpoint },
                { label: isEditing ? "Editar" : "Criar" },
              ]}
            />
          </div>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              {isEditing
                ? `Edite as informações do ${config.name} abaixo.`
                : `Preencha os campos para criar um novo ${config.name}.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingItem ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Carregando...</p>
              </div>
            ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {config.fields.map((field) => (
                  <FormField
                    key={field.name}
                    control={form.control}
                    name={field.name as any}
                    label={field.label}
                    type={field.type || "text"}
                    placeholder={field.placeholder}
                    description={field.description}
                    required={field.required}
                    options={field.options}
                  />
                ))}
                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                  >
                    Cancelar
                  </Button>
                  <SubmitButton loading={form.formState.isSubmitting}>
                    {isEditing ? "Atualizar" : "Criar"}
                  </SubmitButton>
                </div>
              </form>
            </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

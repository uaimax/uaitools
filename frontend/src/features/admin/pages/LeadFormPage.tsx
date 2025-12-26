/** Página de formulário de Lead usando React Hook Form + Zod + TanStack Query. */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MainLayout } from "../components/layout/MainLayout";
import { Breadcrumbs } from "../components/layout/Breadcrumbs";
import { FormField } from "../components/forms/FormField";
import { SubmitButton } from "../components/forms/SubmitButton";
import { Form } from "@/components/ui/form";
import { useLead, useCreateLead, useUpdateLead } from "@/features/leads/hooks/use-leads";
import { getLeadResource } from "@/config/resources/leads";
import { createResourceSchema } from "@/lib/admin/resource-config";
import { useToast } from "@/stores/toast-store";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/SEO";

export default function LeadFormPage() {
  const { t } = useTranslation(["leads", "common", "seo"]);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const { toast } = useToast();

  // Obter resource config traduzido
  const leadResource = getLeadResource();
  const leadSchema = createResourceSchema(leadResource.fields);
  type LeadFormValues = z.infer<typeof leadSchema>;

  // TanStack Query hooks
  const { data: lead, isLoading: isLoadingLead } = useLead(id || null);
  const createMutation = useCreateLead();
  const updateMutation = useUpdateLead();

  // React Hook Form
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      client_workspace: "",
      status: "new",
      notes: "",
    },
  });

  // Carregar dados do lead quando estiver editando
  useEffect(() => {
    if (isEditing && lead) {
      form.reset({
        name: lead.name || "",
        email: lead.email || "",
        phone: lead.phone || "",
        client_workspace: lead.client_workspace || "",
        status: lead.status || "new",
        notes: lead.notes || "",
      });
    }
  }, [isEditing, lead, form]);

  const onSubmit = async (data: LeadFormValues) => {
    try {
      if (isEditing && id) {
        await updateMutation.mutateAsync({ id, data });
        toast({
          title: t("common:messages.success"),
          description: t("leads:toasts.update_success"),
        });
      } else {
        await createMutation.mutateAsync(data);
        toast({
          title: t("common:messages.success"),
          description: t("leads:toasts.create_success"),
        });
      }
      navigate(-1);
    } catch (error: any) {
      toast({
        title: t("common:errors.error"),
        description: error.message || (isEditing ? t("leads:toasts.update_error") : t("leads:toasts.create_error")),
        variant: "destructive",
      });
    }
  };

  const title = isEditing ? leadResource.editTitle : leadResource.createTitle;
  const isLoading = isEditing && isLoadingLead;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // SEO dinâmico baseado no lead
  const seoTitle = isEditing
    ? t("seo:leads.edit.title", { name: lead?.name || "Lead" })
    : t("seo:leads.create.title");
  const seoDescription = isEditing
    ? t("seo:leads.edit.description", { name: lead?.name || "Lead" })
    : t("seo:leads.create.description");

  return (
    <MainLayout>
      <SEO
        title={seoTitle}
        description={seoDescription}
        keywords="leads, criar lead, editar lead, CRM, gerenciamento"
        dynamicData={{
          name: lead?.name,
        }}
        noindex={true}
      />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <Breadcrumbs
              items={[
                { label: t("common:labels.dashboard"), href: "/admin/dashboard" },
                { label: leadResource.listTitle || "", href: "/admin/leads" },
                { label: isEditing ? t("common:actions.edit") : t("common:actions.create") },
              ]}
            />
          </div>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common:actions.back")}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              {isEditing
                ? t("leads:descriptions.edit", { defaultValue: "Edite as informações do lead abaixo." })
                : t("leads:descriptions.create", { defaultValue: "Preencha os campos para criar um novo lead." })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {leadResource.fields.map((field) => (
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
                      {t("common:actions.cancel")}
                    </Button>
                    <SubmitButton loading={isSubmitting}>
                      {isEditing ? t("common:actions.update") : t("common:actions.create")}
                    </SubmitButton>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}


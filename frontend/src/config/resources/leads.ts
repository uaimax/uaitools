import type { ResourceConfig } from "@/lib/admin/resource-config"
import * as z from "zod"
import React from "react"
import i18next from "i18next"
import { getZodMessages } from "@/i18n/zod"

export interface Lead {
  id: number
  name: string
  email: string
  phone?: string
  client_workspace?: string
  status: "new" | "contacted" | "qualified" | "converted" | "lost"
  notes?: string
  source?: string
  created_at: string
  updated_at: string
}

/** Retorna o resource config de leads traduzido. */
export function getLeadResource(): ResourceConfig<Lead> {
  const t = i18next.t.bind(i18next)
  const zodMessages = getZodMessages()

  return {
    name: "lead",
    namePlural: "leads",
    endpoint: "/leads/",

    fields: [
      {
        name: "name",
        label: t("leads:fields.name"),
        type: "text",
        placeholder: t("leads:placeholders.name"),
        required: true,
        schema: z.string().min(1, zodMessages.required()),
      },
      {
        name: "email",
        label: t("leads:fields.email"),
        type: "email",
        placeholder: t("leads:placeholders.email"),
        required: true,
        schema: z.string().email(zodMessages.invalidEmail()).min(1, zodMessages.required()),
      },
      {
        name: "phone",
        label: t("leads:fields.phone"),
        type: "text",
        placeholder: t("leads:placeholders.phone"),
        required: false,
      },
      {
        name: "client_workspace",
        label: t("leads:fields.client_workspace"),
        type: "text",
        placeholder: t("leads:placeholders.client_workspace"),
        required: false,
      },
      {
        name: "status",
        label: t("leads:fields.status"),
        type: "select",
        required: true,
        options: [
          { value: "new", label: t("leads:status.new") },
          { value: "contacted", label: t("leads:status.contacted") },
          { value: "qualified", label: t("leads:status.qualified") },
          { value: "converted", label: t("leads:status.converted") },
          { value: "lost", label: t("leads:status.lost") },
        ],
        schema: z.enum(["new", "contacted", "qualified", "converted", "lost"]),
      },
      {
        name: "notes",
        label: t("leads:fields.notes"),
        type: "textarea",
        placeholder: t("leads:placeholders.notes"),
        required: false,
      },
    ],

    tableColumns: [
      {
        key: "name",
        label: t("leads:fields.name"),
      },
      {
        key: "email",
        label: t("leads:fields.email"),
      },
      {
        key: "phone",
        label: t("leads:fields.phone"),
        render: (value) => value || "-",
      },
      {
        key: "status",
        label: t("leads:fields.status"),
        render: (value) => {
          const statusMap: Record<string, { label: string; color: string }> = {
            new: { label: t("leads:status.new"), color: "bg-blue-100 text-blue-800" },
            contacted: { label: t("leads:status.contacted"), color: "bg-yellow-100 text-yellow-800" },
            qualified: { label: t("leads:status.qualified"), color: "bg-green-100 text-green-800" },
            converted: { label: t("leads:status.converted"), color: "bg-purple-100 text-purple-800" },
            lost: { label: t("leads:status.lost"), color: "bg-red-100 text-red-800" },
          }
          const status = statusMap[value] || { label: value, color: "bg-gray-100 text-gray-800" }
          return React.createElement(
            "span",
            {
              className: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`,
            },
            status.label
          )
        },
      },
      {
        key: "created_at",
        label: t("common:labels.created_at"),
        render: (value) => {
          if (!value) return "-"
          const date = new Date(value)
          // Usar locale do i18next
          const locale = i18next.language === "pt" ? "pt-BR" : "en-US"
          return date.toLocaleDateString(locale)
        },
      },
    ],

    permissions: {
      create: "leads.create",
      view: "leads.view",
      update: "leads.update",
      delete: "leads.delete",
    },

    listTitle: t("leads:title.leads"),
    createTitle: t("leads:title.create_lead"),
    editTitle: t("leads:title.edit_lead"),

    emptyMessage: t("leads:messages.empty"),
    emptyDescription: t("leads:messages.empty_description"),

    searchFields: ["name", "email", "phone", "client_workspace"],
    orderingFields: ["name", "email", "created_at", "status"],
    defaultOrdering: "-created_at",
    initialPageSize: 20,

    rowKey: (row) => row.id,
  }
}

/** Resource config de leads (compatibilidade - usa função traduzida). */
export const leadResource = getLeadResource()


/**
 * Resource Config - Configuração de recursos para Admin
 * 
 * Define tipos e funções para configurar recursos do sistema admin.
 */

import * as z from "zod";
import type { ReactNode } from "react";

/**
 * Tipo de campo de formulário
 */
export type FieldType = "text" | "email" | "number" | "textarea" | "select" | "checkbox" | "date" | "password";

/**
 * Definição de um campo de formulário
 */
export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  schema?: z.ZodTypeAny;
  options?: Array<{ value: string; label: string }>;
  defaultValue?: any;
  disabled?: boolean;
  description?: string;
}

/**
 * Definição de uma coluna de tabela
 */
export interface TableColumn<T = any> {
  key: keyof T | string;
  label: string;
  render?: (value: any, row: T, index: number) => ReactNode;
  sortable?: boolean;
}

/**
 * Permissões de um resource
 */
export interface ResourcePermissions {
  create?: string;
  view?: string;
  update?: string;
  delete?: string;
}

/**
 * Configuração de um resource
 */
export interface ResourceConfig<T = any> {
  /** Nome do resource (singular) */
  name: string;
  /** Nome do resource (plural) */
  namePlural: string;
  /** Endpoint da API (ex: "/leads/") */
  endpoint: string;
  /** Campos do formulário */
  fields: FieldConfig[];
  /** Colunas da tabela */
  tableColumns: TableColumn<T>[];
  /** Permissões necessárias */
  permissions?: ResourcePermissions;
  /** Título da lista */
  listTitle: string;
  /** Título de criação */
  createTitle: string;
  /** Título de edição */
  editTitle: string;
  /** Mensagem quando vazio */
  emptyMessage: string;
  /** Descrição quando vazio */
  emptyDescription?: string;
  /** Campos para busca */
  searchFields?: string[];
  /** Campos para ordenação */
  orderingFields?: string[];
  /** Ordenação padrão */
  defaultOrdering?: string;
  /** Tamanho inicial da página */
  initialPageSize?: number;
  /** Função para obter a chave única da linha */
  rowKey?: (row: T) => string | number;
}

/**
 * Cria um schema Zod a partir dos campos de um resource
 * 
 * @param fields - Campos do resource
 * @returns Schema Zod
 */
export function createResourceSchema(fields: FieldConfig[]): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    if (field.schema) {
      shape[field.name] = field.schema;
    } else {
      // Schema padrão baseado no tipo
      let fieldSchema: z.ZodTypeAny = z.string();

      if (field.type === "number") {
        fieldSchema = z.number();
      } else if (field.type === "checkbox") {
        fieldSchema = z.boolean();
      } else if (field.type === "email") {
        fieldSchema = z.string().email();
      }

      // Se não é required, tornar opcional
      if (!field.required) {
        fieldSchema = fieldSchema.optional();
      }

      shape[field.name] = fieldSchema;
    }
  }

  return z.object(shape);
}

/**
 * Cria colunas de tabela a partir da configuração de um resource
 * 
 * @param config - Configuração do resource
 * @returns Array de colunas
 */
export function createTableColumns<T = any>(config: ResourceConfig<T>): TableColumn<T>[] {
  return config.tableColumns || [];
}


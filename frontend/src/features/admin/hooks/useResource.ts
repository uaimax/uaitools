import { useState, useEffect, useCallback, useRef } from "react"
import { apiClient } from "@/config/api"
import type { ResourceConfig } from "@/lib/admin/resource-config"
import { useWorkspace } from "./useWorkspace"

export interface UseResourceOptions<T extends Record<string, any> = any> {
  resource: ResourceConfig<T>
  basePath: string
  /** Se true, não faz fetch automático no mount (útil para páginas de formulário) */
  skipInitialFetch?: boolean
}

export interface UseResourceReturn<T = any> {
  items: T[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  getItem: (id: string | number) => Promise<T>
  create: (data: Partial<T>) => Promise<T>
  update: (id: string | number, data: Partial<T>) => Promise<T>
  delete: (id: string | number) => Promise<void>
}

export function useResource<T extends Record<string, any> = any>(
  options: UseResourceOptions<T>
): UseResourceReturn<T> {
  const { basePath, skipInitialFetch = false } = options
  const { workspaceId, workspaceSlug } = useWorkspace()
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(!skipInitialFetch)
  const [error, setError] = useState<string | null>(null)
  const hasFetchedRef = useRef(false)
  const lastWorkspaceRef = useRef<string | null>(null)

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get(basePath)
      const data = response.data.results || response.data
      setItems(data)
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Erro ao carregar dados"
      setError(errorMsg)
      console.error("Erro ao buscar recursos:", err)
    } finally {
      setLoading(false)
    }
  }, [basePath])

  // Identificador único do workspace atual (slug ou id)
  const currentWorkspace = workspaceSlug || workspaceId || null

  useEffect(() => {
    // Se o workspace mudou, resetar o refetch flag e fazer novo fetch
    if (lastWorkspaceRef.current !== currentWorkspace) {
      lastWorkspaceRef.current = currentWorkspace
      hasFetchedRef.current = false
      // Limpar items anteriores quando workspace mudar
      setItems([])
    }

    // Só fazer fetch se não for skipInitialFetch e ainda não tiver feito
    if (!skipInitialFetch && !hasFetchedRef.current) {
      hasFetchedRef.current = true
      fetchItems()
    }
  }, [skipInitialFetch, fetchItems, currentWorkspace])

  const create = useCallback(async (data: Partial<T>): Promise<T> => {
    try {
      const response = await apiClient.post(basePath, data)
      // Não fazer refetch automático - deixar o componente decidir
      return response.data
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Erro ao criar"
      setError(errorMsg)
      throw new Error(errorMsg)
    }
  }, [basePath])

  const update = useCallback(async (id: string | number, data: Partial<T>): Promise<T> => {
    try {
      // Garantir que não há barra dupla
      const cleanBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath
      const response = await apiClient.patch(`${cleanBasePath}/${id}/`, data)
      // Não fazer refetch automático - deixar o componente decidir
      return response.data
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Erro ao atualizar"
      setError(errorMsg)
      throw new Error(errorMsg)
    }
  }, [basePath])

  const getItem = useCallback(async (id: string | number): Promise<T> => {
    try {
      // Garantir que basePath termina com / e não duplicar barras
      const cleanBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath
      const url = `${cleanBasePath}/${id}/`
      const response = await apiClient.get(url)
      return response.data
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Erro ao buscar item"
      setError(errorMsg)
      throw new Error(errorMsg)
    }
  }, [basePath])

  const deleteItem = useCallback(async (id: string | number): Promise<void> => {
    try {
      const cleanBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath
      await apiClient.delete(`${cleanBasePath}/${id}/`)
      // Não fazer refetch automático - deixar o componente decidir
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Erro ao deletar"
      setError(errorMsg)
      throw new Error(errorMsg)
    }
  }, [basePath])

  return {
    items,
    loading,
    error,
    refetch: fetchItems,
    getItem,
    create,
    update,
    delete: deleteItem,
  }
}

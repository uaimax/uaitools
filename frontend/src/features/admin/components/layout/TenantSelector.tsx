import { useState, useEffect } from "react"
import { useWorkspaces, useSwitchWorkspace } from "@/features/admin/hooks/use-workspaces"
import { useWorkspace } from "@/features/admin/hooks/useWorkspace"
import { useAuth } from "@/stores/auth-store"
import { Select, SelectItem } from "@/components/ui/select"
import { Building2, Shield } from "lucide-react"

export function WorkspaceSelector() {
  const { user } = useAuth()
  const { workspaceId, workspaceSlug } = useWorkspace()
  const { data: workspaces = [], isLoading: loading } = useWorkspaces()
  const switchWorkspaceMutation = useSwitchWorkspace()
  // Usar slug se disponível, senão usar ID
  const currentWorkspaceSlug = workspaceSlug || workspaceId || ""
  const isSuperAdmin = user?.is_superuser || false
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>(currentWorkspaceSlug || (isSuperAdmin ? "none" : ""))

  useEffect(() => {
    // Atualizar selectedWorkspace quando o workspace atual mudar
    if (currentWorkspaceSlug) {
      setSelectedWorkspace(currentWorkspaceSlug)
    } else if (isSuperAdmin) {
      // Super admin sem workspace selecionado: mostrar "none"
      setSelectedWorkspace("none")
    } else {
      setSelectedWorkspace("")
    }
  }, [currentWorkspaceSlug, isSuperAdmin])

  const handleChange = (value: string) => {
    console.log("WorkspaceSelector: mudança para", value)

    // Se for "none" ou vazio, limpar workspace (super admin vê todos)
    if (value === "none" || !value) {
      console.log("WorkspaceSelector: limpando workspace selecionado")
      localStorage.removeItem("workspace_id")
      // Disparar evento customizado para notificar mudança na mesma janela
      window.dispatchEvent(new Event("workspace-changed"))
      setSelectedWorkspace("")
      // Não recarregar - deixar React Router atualizar
      return
    }

    setSelectedWorkspace(value)
    // value já é o slug (definido no SelectItem)
    switchWorkspaceMutation.mutate(value)
  }

  // Super admin sempre vê o seletor, mesmo com apenas 1 workspace
  // Usuários normais só veem se tiverem mais de 1 workspace
  const shouldShow = isSuperAdmin || workspaces.length > 1

  if (loading || !shouldShow) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      {isSuperAdmin && (
        <Shield className="h-4 w-4 text-primary" aria-label="Super Admin" />
      )}
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select
        value={selectedWorkspace}
        onChange={handleChange}
        placeholder="Selecionar workspace"
        className="w-[200px]"
      >
        {isSuperAdmin && (
          <SelectItem value="none">
            (Todos os workspaces)
          </SelectItem>
        )}
        {workspaces.map((workspace) => (
          <SelectItem key={workspace.id} value={workspace.slug || workspace.id.toString()}>
            {workspace.name}
          </SelectItem>
        ))}
      </Select>
    </div>
  )
}

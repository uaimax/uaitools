import { useState } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface BulkActionsProps {
  selectedItems: (string | number)[]
  onDelete?: (ids: (string | number)[]) => void
  onSelectAll?: () => void
  onDeselectAll?: () => void
  totalItems?: number
}

export function BulkActions({
  selectedItems,
  onDelete,
  onSelectAll,
  onDeselectAll,
  totalItems = 0,
}: BulkActionsProps) {
  const [open, setOpen] = useState(false)

  if (selectedItems.length === 0) return null

  const allSelected = selectedItems.length === totalItems && totalItems > 0

  const handleDelete = () => {
    if (onDelete) {
      onDelete(selectedItems)
      setOpen(false)
    }
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border bg-muted/50 p-3">
      <div className="flex-1">
        <span className="text-sm font-medium">
          {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""} selecionado
          {selectedItems.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {allSelected ? (
          <Button variant="outline" size="sm" onClick={onDeselectAll}>
            Desmarcar todos
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={onSelectAll}>
            Selecionar todos
          </Button>
        )}
        {onDelete && (
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Deletar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja deletar {selectedItems.length} item
                  {selectedItems.length !== 1 ? "s" : ""}? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Deletar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  )
}


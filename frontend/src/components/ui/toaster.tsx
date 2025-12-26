import { useToastStore } from "@/stores/toast-store"
import { Toast } from "@/components/ui/toast"

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts)
  const dismiss = useToastStore((state) => state.dismiss)

  // Filtrar apenas toasts abertos (não marcados como open: false)
  const openToasts = toasts.filter((t) => t.open !== false)

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {openToasts.map((toastItem) => {
        // Converter title e description para string se necessário
        const title = toastItem.title ? String(toastItem.title) : undefined
        const description = toastItem.description ? String(toastItem.description) : undefined

        return (
          <Toast
            key={toastItem.id}
            id={toastItem.id}
            title={title}
            description={description}
            action={toastItem.action}
            variant={toastItem.variant}
            onOpenChange={(open) => {
              // Quando fechar, chamar dismiss do store
              if (!open) {
                dismiss(toastItem.id)
              }
            }}
            onDismiss={() => {
              // Chamar dismiss do store
              dismiss(toastItem.id)
            }}
          />
        )
      })}
    </div>
  )
}

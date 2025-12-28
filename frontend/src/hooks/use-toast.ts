export { useToast } from "@/stores/toast-store";

// Exportar função toast direta para compatibilidade
import { useToastStore, type ToastProps } from "@/stores/toast-store";

/** Função helper para exibir toast sem precisar do hook.
 *
 * Útil para usar em componentes que não podem usar hooks.
 */
export const toast = (props: ToastProps) => {
  return useToastStore.getState().toast(props);
};


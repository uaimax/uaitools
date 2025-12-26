/** Store Zustand para gerenciamento de toasts. */

import { create } from "zustand";
import type { ReactNode } from "react";

type ToastActionElement = React.ReactElement<any>;

export type ToastProps = {
  id?: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ToastActionElement;
  variant?: "default" | "destructive";
  onOpenChange?: (open: boolean) => void;
};

type ToasterToast = ToastProps & {
  id: string;
  open?: boolean;
};

const TOAST_LIMIT = 1;

let count = 0;

function genId(): string {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

interface ToastState {
  toasts: ToasterToast[];
  toast: (props: ToastProps) => {
    id: string;
    dismiss: () => void;
    update: (props: Partial<ToasterToast>) => void;
  };
  dismiss: (toastId?: string) => void;
  remove: (toastId: string) => void;
}

/** Store de toasts usando Zustand.
 *
 * Gerencia notificações toast na aplicação.
 */
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  toast: (props: ToastProps) => {
    const id = props.id || genId();

    const dismiss = () => {
      set((state) => ({
        toasts: state.toasts.map((toast) =>
          toast.id === id ? { ...toast, open: false } : toast
        ),
      }));
    };

    const update = (newProps: Partial<ToasterToast>) => {
      set((state) => ({
        toasts: state.toasts.map((toast) =>
          toast.id === id ? { ...toast, ...newProps } : toast
        ),
      }));
    };

    const newToast: ToasterToast = {
      ...props,
      id,
      open: true,
      onOpenChange: (open: boolean) => {
        if (!open) dismiss();
        props.onOpenChange?.(open);
      },
    };

    set((state) => ({
      toasts: [newToast, ...state.toasts].slice(0, TOAST_LIMIT),
    }));

    return { id, dismiss, update };
  },

  dismiss: (toastId?: string) => {
    if (!toastId) {
      set((state) => ({
        toasts: state.toasts.map((toast) => ({ ...toast, open: false })),
      }));
    } else {
      set((state) => ({
        toasts: state.toasts.map((toast) =>
          toast.id === toastId ? { ...toast, open: false } : toast
        ),
      }));
    }
  },

  remove: (toastId: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== toastId),
    }));
  },
}));

/** Hook de conveniência para usar o store de toasts.
 *
 * Mantém compatibilidade com o hook anterior `useToast()`.
 */
export const useToast = () => {
  const store = useToastStore();
  return {
    toasts: store.toasts,
    toast: store.toast,
    dismiss: store.dismiss,
  };
};




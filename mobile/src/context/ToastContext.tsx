/**
 * Context de Toast (notificações)
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { colors } from '@/theme';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, action?: Toast['action']) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (
    message: string,
    type: ToastType = 'info',
    action?: Toast['action']
  ) => {
    const id = Date.now().toString();
    const toast: Toast = { id, message, type, action };

    setToasts((prev) => [...prev, toast]);

    // Auto-dismiss após 5 segundos (aumentado para melhorar UX)
    // Erros ficam mais tempo para o usuário ler
    const dismissTime = type === 'error' ? 6000 : 5000;
    setTimeout(() => {
      hideToast(id);
    }, dismissTime);
  };

  const hideToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const value: ToastContextType = {
    toasts,
    showToast,
    hideToast,
  };

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};


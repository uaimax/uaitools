/** Error Boundary do React para capturar erros de renderização. */

import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { logError } from "@/lib/error-logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Atualizar state para mostrar UI de fallback
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Logar erro para GlitchTip ou banco
    logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Renderizar UI de fallback customizada ou padrão
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-destructive mb-4">
              Algo deu errado
            </h1>
            <p className="text-muted-foreground mb-4">
              Ocorreu um erro inesperado. O erro foi registrado e será investigado.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


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
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/8a2091d5-0f0b-4303-b859-a6756e62cd84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ErrorBoundary.tsx:28',message:'ErrorBoundary capturou erro',data:{errorMessage:error.message,errorName:error.name,errorStack:error.stack,componentStack:errorInfo.componentStack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    // Logar no console para debug
    console.error("ErrorBoundary capturou erro:", error);
    console.error("Stack do componente:", errorInfo.componentStack);
    console.error("Detalhes do erro:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    // Logar erro para GlitchTip ou banco
    try {
      logError(error, {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      });
    } catch (logError) {
      console.error("Erro ao logar no sistema de erros:", logError);
    }
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


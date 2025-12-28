/**
 * Error Boundary para capturar erros não tratados
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { colors } from '@/theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log para Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    this.setState({
      error,
      errorInfo,
    });

    console.error('[ErrorBoundary] Erro capturado:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>Ops! Algo deu errado</Text>
            <Text style={styles.message}>
              O aplicativo encontrou um erro inesperado. Por favor, tente novamente.
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>Detalhes do erro (dev):</Text>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
                {this.state.errorInfo && (
                  <Text style={styles.errorStack}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    width: '100%',
    backgroundColor: colors.bg.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.semantic.error,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  errorStack: {
    fontSize: 10,
    color: colors.text.tertiary,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: colors.primary.default,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: colors.text.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});


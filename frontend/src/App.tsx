import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "./components/theme-provider";
import { AuthInitializer } from "./components/AuthInitializer";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Toaster } from "./components/ui/toaster";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import { queryClient } from "./lib/query-client";
// Auth pages
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import OAuthCallback from "./features/auth/pages/OAuthCallback";
import ForgotPassword from "./features/auth/pages/ForgotPassword";
import ResetPassword from "./features/auth/pages/ResetPassword";
// Admin pages
import DashboardPage from "./features/admin/pages/DashboardPage";
import LeadsPage from "./features/admin/pages/LeadsPage";
import LeadFormPage from "./features/admin/pages/LeadFormPage";
import SettingsPage from "./features/admin/pages/SettingsPage";
import DocumentsPage from "./features/admin/pages/DocumentsPage";

// Componente para redirecionar /leads/:id para /admin/leads/:id
function LeadsRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/admin/leads/${id}`} replace />;
}

function App() {
  // Limpar apenas valores claramente inválidos (nulos/vazios) do localStorage ao iniciar
  // NÃO validar slugs aqui - o backend valida se o slug existe e está ativo
  // Removido: validação de localStorage não é mais necessária aqui
  // O backend valida se o slug existe e está ativo

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthInitializer>
            <BrowserRouter>
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />
            <Route
              path="/"
              element={
                <Layout>
                  <Home />
                </Layout>
              }
            />
            {/* Redirecionar /dashboard para /admin/dashboard (consolidar rotas) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Navigate to="/admin/dashboard" replace />
                </ProtectedRoute>
              }
            />
            {/* Rotas Admin */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Navigate to="/admin/dashboard" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/leads"
              element={
                <ProtectedRoute>
                  <LeadsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/leads/new"
              element={
                <ProtectedRoute>
                  <LeadFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/leads/:id"
              element={
                <ProtectedRoute>
                  <LeadFormPage />
                </ProtectedRoute>
              }
            />
            {/* Rota alternativa para compatibilidade */}
            <Route
              path="/leads/:id"
              element={
                <ProtectedRoute>
                  <LeadsRedirect />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/documents"
              element={
                <ProtectedRoute>
                  <DocumentsPage />
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster />
        </BrowserRouter>
        </AuthInitializer>
      </ThemeProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

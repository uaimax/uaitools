import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { ThemeToggle } from "./theme-toggle"

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold">
            SaaS Bootstrap
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/login" className="text-sm hover:underline">
              Login
            </Link>
            <Link to="/register" className="text-sm hover:underline">
              Registrar
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          © 2024 SaaS Bootstrap. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  )
}

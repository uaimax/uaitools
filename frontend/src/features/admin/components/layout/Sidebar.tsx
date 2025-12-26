import { useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const { t } = useTranslation(["common"])
  const location = useLocation()

  const menuItems = [
    { icon: LayoutDashboard, label: t("common:navigation.dashboard"), path: "/admin/dashboard" },
    { icon: Users, label: t("common:navigation.leads"), path: "/admin/leads" },
    { icon: FileText, label: t("common:navigation.documents"), path: "/admin/documents" },
    { icon: Settings, label: t("common:navigation.settings"), path: "/admin/settings" },
  ]

  return (
    <aside className="w-64 border-r bg-card">
      <div className="flex h-full flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold">SaaS Bootstrap</h1>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path ||
              location.pathname.startsWith(item.path + "/")

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}


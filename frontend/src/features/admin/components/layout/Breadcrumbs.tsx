import { Link } from "react-router-dom"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
      <Link
        to="/admin/dashboard"
        className="flex items-center hover:text-foreground"
      >
        <Home className="h-4 w-4" />
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4" />
          {item.href ? (
            <Link
              to={item.href}
              className={cn(
                "hover:text-foreground",
                index === items.length - 1 && "text-foreground font-medium"
              )}
            >
              {item.label}
            </Link>
          ) : (
            <span
              className={cn(
                index === items.length - 1 && "text-foreground font-medium"
              )}
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}




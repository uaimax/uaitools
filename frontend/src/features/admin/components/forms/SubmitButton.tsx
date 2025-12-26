import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SubmitButtonProps {
  loading?: boolean
  disabled?: boolean
  children: React.ReactNode
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

export function SubmitButton({
  loading = false,
  disabled = false,
  children,
  className,
  variant = "default",
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={loading || disabled}
      variant={variant}
      className={cn(className)}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  )
}




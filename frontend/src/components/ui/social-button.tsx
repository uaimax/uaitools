import { Button } from "@/components/ui/button"
import { initiateSocialLogin } from "@/features/auth/services/socialAuth"

interface SocialButtonProps {
  provider: string
  name: string
  icon?: React.ReactNode
  workspaceSlug?: string
}

export function SocialButton({ provider, name, icon, workspaceSlug }: SocialButtonProps) {
  const handleClick = () => {
    initiateSocialLogin(provider, workspaceSlug)
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={handleClick}
    >
      {icon && <span className="mr-2">{icon}</span>}
      Continuar com {name}
    </Button>
  )
}

import * as React from "react"
import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "checked" | "onChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<
  HTMLInputElement,
  CheckboxProps
>(({ className, checked = false, onCheckedChange, id, ...props }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newChecked = e.target.checked;
    onCheckedChange?.(newChecked);
  };

  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();
  };

  return (
    <input
      type="checkbox"
      ref={ref}
      id={id}
      checked={checked}
      onChange={handleChange}
      onClick={handleClick}
      className={cn(
        "h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground cursor-pointer",
        checked && "bg-primary text-primary-foreground",
        className
      )}
      {...props}
    />
  );
})
Checkbox.displayName = "Checkbox"

export { Checkbox }

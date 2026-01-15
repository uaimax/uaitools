/** Componente RadioGroup usando Headless UI RadioGroup. */

import * as React from "react";
import { RadioGroup as HeadlessRadioGroup } from "@headlessui/react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface RadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ value, onValueChange, children, className, ...props }, ref) => {
    return (
      <HeadlessRadioGroup
        value={value}
        onChange={onValueChange}
        ref={ref}
        className={cn("space-y-2", className)}
        {...props}
      >
        {children}
      </HeadlessRadioGroup>
    );
  }
);
RadioGroup.displayName = "RadioGroup";

export interface RadioGroupItemProps {
  value: string;
  id?: string;
  className?: string;
}

const RadioGroupItem = React.forwardRef<HTMLDivElement, RadioGroupItemProps>(
  ({ value, id, className, ...props }, ref) => {
    return (
      <HeadlessRadioGroup.Option value={value} ref={ref} {...props}>
        {({ checked }) => (
          <div
            className={cn(
              "flex items-center space-x-2 cursor-pointer",
              className
            )}
          >
            <div
              className={cn(
                "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                checked
                  ? "border-primary bg-primary"
                  : "border-input bg-background"
              )}
            >
              {checked && (
                <Check className="w-3 h-3 text-primary-foreground" />
              )}
            </div>
          </div>
        )}
      </HeadlessRadioGroup.Option>
    );
  }
);
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };

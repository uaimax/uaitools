/** Componente Dropdown Menu usando Headless UI. */

import * as React from "react";
import { Menu, Transition } from "@headlessui/react";
import { cn } from "@/lib/utils";

export interface DropdownMenuProps {
  children: React.ReactNode;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  return <Menu as="div" className="relative">{children}</Menu>;
};

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
  }
>(({ asChild, children, className, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    return (
      <Menu.Button as={React.Fragment}>
        {React.cloneElement(children as React.ReactElement<any>, {
          ref,
          ...props,
        })}
      </Menu.Button>
    );
  }
  return (
    <Menu.Button ref={ref} className={cn(className)} {...props}>
      {children}
    </Menu.Button>
  );
});
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: "start" | "end" | "center";
  }
>(({ className, align = "end", ...props }, ref) => {
  return (
    <Transition
      as={React.Fragment}
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
    >
      <Menu.Items
        ref={ref}
        className={cn(
          "absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
          align === "end" && "right-0",
          align === "start" && "left-0",
          align === "center" && "left-1/2 -translate-x-1/2",
          className
        )}
        {...props}
      />
    </Transition>
  );
});
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    disabled?: boolean;
  }
>(({ className, disabled, onClick, ...props }, ref) => {
  return (
    <Menu.Item disabled={disabled}>
      {({ active, disabled: itemDisabled }) => (
        <div
          ref={ref}
          className={cn(
            "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
            active && "bg-accent text-accent-foreground",
            (disabled || itemDisabled) && "pointer-events-none opacity-50",
            className
          )}
          onClick={onClick}
          {...props}
        />
      )}
    </Menu.Item>
  );
});
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
};

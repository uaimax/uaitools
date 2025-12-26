/** Componente Popover usando Headless UI Popover. */

import * as React from "react";
import { Popover as HeadlessPopover, Transition } from "@headlessui/react";
import { cn } from "@/lib/utils";

export interface PopoverProps {
  children: React.ReactNode;
}

const Popover: React.FC<PopoverProps> = ({ children }) => {
  return <HeadlessPopover className="relative">{children}</HeadlessPopover>;
};

const PopoverTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
  }
>(({ asChild, children, className, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    return (
      <HeadlessPopover.Button as={React.Fragment}>
        {React.cloneElement(children as React.ReactElement<any>, {
          ref,
          ...props,
        })}
      </HeadlessPopover.Button>
    );
  }
  return (
    <HeadlessPopover.Button ref={ref} className={cn(className)} {...props}>
      {children}
    </HeadlessPopover.Button>
  );
});
PopoverTrigger.displayName = "PopoverTrigger";

const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: "start" | "end" | "center";
  }
>(({ className, align = "start", ...props }, ref) => {
  return (
    <Transition
      as={React.Fragment}
      enter="transition ease-out duration-200"
      enterFrom="opacity-0 translate-y-1"
      enterTo="opacity-100 translate-y-0"
      leave="transition ease-in duration-150"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 translate-y-1"
    >
      <HeadlessPopover.Panel
        ref={ref}
        className={cn(
          "absolute z-50 mt-2 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
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
PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverTrigger, PopoverContent };

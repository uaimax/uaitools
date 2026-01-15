/** Componente Sheet (drawer lateral) usando Headless UI Dialog. */

import * as React from "react";
import { Dialog as HeadlessDialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: "left" | "right" | "top" | "bottom";
}

const Sheet: React.FC<SheetProps> = ({
  open,
  onOpenChange,
  children,
  side = "right",
}) => {
  const sideClasses = {
    left: "left-0 top-0 h-full",
    right: "right-0 top-0 h-full",
    top: "top-0 left-0 w-full",
    bottom: "bottom-0 left-0 w-full",
  };

  return (
    <HeadlessDialog open={open} onClose={onOpenChange}>
      <Transition show={open}>
        {/* Backdrop */}
        <Transition.Child
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 z-40" />
        </Transition.Child>

        {/* Panel */}
        <div className="fixed inset-0 z-50 flex">
          <Transition.Child
            enter="ease-out duration-300"
            enterFrom={
              side === "right"
                ? "translate-x-full"
                : side === "left"
                ? "-translate-x-full"
                : side === "top"
                ? "-translate-y-full"
                : "translate-y-full"
            }
            enterTo="translate-x-0 translate-y-0"
            leave="ease-in duration-200"
            leaveFrom="translate-x-0 translate-y-0"
            leaveTo={
              side === "right"
                ? "translate-x-full"
                : side === "left"
                ? "-translate-x-full"
                : side === "top"
                ? "-translate-y-full"
                : "translate-y-full"
            }
          >
            <HeadlessDialog.Panel
              className={cn(
                "fixed bg-background border shadow-lg",
                sideClasses[side],
                side === "left" || side === "right" ? "w-[400px] sm:w-[540px]" : "h-[400px]"
              )}
            >
              {children}
            </HeadlessDialog.Panel>
          </Transition.Child>
        </div>
      </Transition>
    </HeadlessDialog>
  );
};

export interface SheetContentProps {
  children: React.ReactNode;
  className?: string;
}

const SheetContent: React.FC<SheetContentProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {children}
    </div>
  );
};

export interface SheetHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const SheetHeader: React.FC<SheetHeaderProps> = ({ children, className }) => {
  return (
    <div className={cn("flex flex-col space-y-2 p-6 border-b", className)}>
      {children}
    </div>
  );
};

export interface SheetTitleProps {
  children: React.ReactNode;
  className?: string;
}

const SheetTitle: React.FC<SheetTitleProps> = ({ children, className }) => {
  return (
    <h2 className={cn("text-lg font-semibold", className)}>{children}</h2>
  );
};

export { Sheet, SheetContent, SheetHeader, SheetTitle };

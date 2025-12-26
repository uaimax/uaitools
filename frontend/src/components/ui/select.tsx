/** Componente Select usando Headless UI Listbox. */

import * as React from "react";
import { Listbox, Transition } from "@headlessui/react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ className, value = "", onChange, placeholder, disabled, children, ...props }, ref) => {
    // Encontrar o item selecionado para exibir o label
    const selectedItem = React.Children.toArray(children).find(
      (child) =>
        React.isValidElement(child) &&
        (child.props as any).value === value
    ) as React.ReactElement<any> | undefined;

    const displayValue = selectedItem
      ? (selectedItem.props as any).children || selectedItem.props.value
      : placeholder || "Selecione...";

    return (
      <Listbox value={value} onChange={onChange || (() => {})} disabled={disabled}>
        <div ref={ref} className={cn("relative", className)} {...props}>
          <Listbox.Button
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
          >
            <span className={cn(value ? "text-foreground" : "text-muted-foreground")}>
              {displayValue}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
          </Listbox.Button>
          <Transition
            as={React.Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover py-1 text-popover-foreground shadow-md focus:outline-none">
              {children}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    );
  }
);
Select.displayName = "Select";

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string;
  }
>(({ className, value, children, ...props }, ref) => {
  return (
    <Listbox.Option
      value={value}
      className={({ active }) =>
        cn(
          "relative cursor-default select-none py-2 pl-10 pr-4",
          active ? "bg-accent text-accent-foreground" : "text-foreground",
          className
        )
      }
    >
      {({ selected }) => (
        <div ref={ref} {...props}>
          <span className={cn("block truncate", selected ? "font-medium" : "font-normal")}>
            {children}
          </span>
          {selected && (
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-foreground">
              <Check className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
        </div>
      )}
    </Listbox.Option>
  );
});
SelectItem.displayName = "SelectItem";

export { Select, SelectItem };

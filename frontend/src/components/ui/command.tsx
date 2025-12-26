import * as React from "react"
import { Search, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CommandContextType {
  value: string
  setValue: (value: string) => void
  selectedIndex: number
  setSelectedIndex: (index: number) => void
  items: Array<{ value: string; label: string }>
  onSelect: (value: string) => void
}

const CommandContext = React.createContext<CommandContextType | undefined>(undefined)

const useCommandContext = () => {
  const context = React.useContext(CommandContext)
  if (!context) {
    throw new Error("Command components must be used within Command")
  }
  return context
}

export interface CommandProps {
  children: React.ReactNode
  items: Array<{ value: string; label: string }>
  onSelect?: (value: string) => void
  placeholder?: string
  emptyMessage?: string
}

const Command: React.FC<CommandProps> = ({
  children,
  items,
  onSelect,
  placeholder = "Buscar...",
  emptyMessage = "Nenhum resultado encontrado.",
}) => {
  const [value, setValue] = React.useState("")
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [open, setOpen] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  const filteredItems = React.useMemo(() => {
    if (!value) return items
    return items.filter((item) =>
      item.label.toLowerCase().includes(value.toLowerCase())
    )
  }, [value, items])

  const handleSelect = (itemValue: string) => {
    onSelect?.(itemValue)
    setOpen(false)
    setValue("")
  }

  // Navegação por teclado
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0))
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (filteredItems[selectedIndex]) {
          handleSelect(filteredItems[selectedIndex].value)
        }
      } else if (e.key === "Escape") {
        setOpen(false)
        setValue("")
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, selectedIndex, filteredItems])

  // Scroll para item selecionado
  React.useEffect(() => {
    if (listRef.current && open) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" })
      }
    }
  }, [selectedIndex, open])

  return (
    <CommandContext.Provider
      value={{
        value,
        setValue,
        selectedIndex,
        setSelectedIndex,
        items: filteredItems,
        onSelect: handleSelect,
      }}
    >
      <div className="relative">
        <CommandInput
          ref={inputRef}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
        />
        {open && (
          <CommandList ref={listRef} emptyMessage={emptyMessage}>
            {children}
          </CommandList>
        )}
      </div>
    </CommandContext.Provider>
  )
}

const CommandInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  const { value, setValue } = useCommandContext()

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
        {...props}
      />
    </div>
  )
})
CommandInput.displayName = "CommandInput"

const CommandList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    emptyMessage?: string
  }
>(({ className, emptyMessage, children, ...props }, ref) => {
  const { items } = useCommandContext()

  return (
    <div
      ref={ref}
      className={cn(
        "absolute top-full z-50 mt-1 max-h-[300px] w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        className
      )}
      {...props}
    >
      {items.length === 0 ? (
        <div className="py-6 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        children
      )}
    </div>
  )
})
CommandList.displayName = "CommandList"

const CommandItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string
  }
>(({ className, value, children, ...props }, ref) => {
  const { selectedIndex, setSelectedIndex, items, onSelect } = useCommandContext()
  const index = items.findIndex((item) => item.value === value)
  const isSelected = index === selectedIndex

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
        isSelected && "bg-accent text-accent-foreground",
        "hover:bg-accent hover:text-accent-foreground",
        className
      )}
      onMouseEnter={() => setSelectedIndex(index)}
      onClick={() => onSelect(value)}
      {...props}
    >
      {isSelected && <Check className="mr-2 h-4 w-4" />}
      {children}
    </div>
  )
})
CommandItem.displayName = "CommandItem"

const CommandEmpty = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("py-6 text-center text-sm text-muted-foreground", className)}
    {...props}
  />
))
CommandEmpty.displayName = "CommandEmpty"

export { Command, CommandInput, CommandList, CommandItem, CommandEmpty }




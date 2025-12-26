import * as React from "react"
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form"
import { useFormContext } from "react-hook-form"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectItem } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

// Contextos necessários para FormItem, FormLabel, etc.
const FormFieldContext = React.createContext<{ name: string } | undefined>(undefined)
const FormItemContext = React.createContext<{ id: string } | undefined>(undefined)

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  if (!itemContext) {
    throw new Error("useFormField should be used within <FormItem>")
  }

  const fieldState = getFieldState(fieldContext.name, formState)

  return {
    id: itemContext.id,
    name: fieldContext.name,
    formItemId: `${itemContext.id}-form-item`,
    formDescriptionId: `${itemContext.id}-form-item-description`,
    formMessageId: `${itemContext.id}-form-item-message`,
    ...fieldState,
  }
}

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <div
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

interface FormFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  label: string
  type?: "text" | "email" | "password" | "number" | "textarea" | "select" | "checkbox"
  placeholder?: string
  description?: string
  required?: boolean
  options?: { value: string; label: string }[]
  disabled?: boolean
}

export function FormField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  type = "text",
  placeholder,
  description,
  required = false,
  options = [],
  disabled = false,
}: FormFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormFieldContext.Provider value={{ name: String(name) }}>
          <FormItem>
            <FormLabel>
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
            <FormControl>
              {type === "textarea" ? (
                <Textarea
                  {...field}
                  placeholder={placeholder}
                  disabled={disabled}
                  rows={4}
                  value={field.value || ""}
                />
              ) : type === "select" ? (
                <Select
                  value={field.value || ""}
                  onChange={field.onChange}
                  disabled={disabled}
                  placeholder={placeholder || `Selecione ${label.toLowerCase()}`}
                >
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </Select>
              ) : type === "checkbox" ? (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                    disabled={disabled}
                  />
                  <span className="text-sm text-muted-foreground">{description}</span>
                </div>
              ) : (
                <Input
                  {...field}
                  type={type}
                  placeholder={placeholder}
                  disabled={disabled}
                  value={field.value || ""}
                />
              )}
            </FormControl>
            {description && type !== "checkbox" && (
              <FormDescription>{description}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        </FormFieldContext.Provider>
      )}
    />
  )
}


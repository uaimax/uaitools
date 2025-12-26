import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { TableColumn } from "@/features/admin/hooks/useTable"
import { cn } from "@/lib/utils"

interface DataTableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  onSort?: (key: string) => void
  sortedColumn?: string | null
  sortDirection?: "asc" | "desc"
  rowKey?: (row: T) => string | number
  onRowClick?: (row: T) => void
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  onSort,
  sortedColumn,
  sortDirection,
  rowKey = (row: T) => (row.id as string | number) || Math.random(),
  onRowClick,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={cn(
                  col.sortable && onSort && "cursor-pointer hover:bg-muted/50"
                )}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <div className="flex items-center gap-2">
                  {col.label}
                  {col.sortable && onSort && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSort(col.key)
                      }}
                    >
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  )}
                  {sortedColumn === col.key && (
                    <span className="text-xs text-muted-foreground">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Nenhum dado encontrado
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow
                key={rowKey(row)}
                className={cn(onRowClick && "cursor-pointer")}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    {col.render
                      ? col.render(row[col.key], row)
                      : String(row[col.key] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}




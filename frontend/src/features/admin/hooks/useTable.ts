import { useState, useMemo } from "react"

export interface TableColumn<T> {
  key: string
  label: string
  render?: (value: any, row: T) => React.ReactNode
  sortable?: boolean
}

export interface UseTableOptions<T> {
  data: T[]
  columns: TableColumn<T>[]
  initialSort?: {
    key: string
    direction: "asc" | "desc"
  }
  pageSize?: number
}

export interface UseTableReturn<T> {
  sortedData: T[]
  sortedColumn: string | null
  sortDirection: "asc" | "desc"
  handleSort: (key: string) => void
  paginatedData: T[]
  currentPage: number
  totalPages: number
  goToPage: (page: number) => void
  nextPage: () => void
  previousPage: () => void
}

export function useTable<T extends Record<string, any>>(
  options: UseTableOptions<T>
): UseTableReturn<T> {
  const { data, columns, initialSort, pageSize = 10 } = options

  const [sortedColumn, setSortedColumn] = useState<string | null>(
    initialSort?.key || null
  )
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(
    initialSort?.direction || "asc"
  )
  const [currentPage, setCurrentPage] = useState(1)

  const sortedData = useMemo(() => {
    if (!sortedColumn) return data

    const column = columns.find((col) => col.key === sortedColumn)
    if (!column || !column.sortable) return data

    return [...data].sort((a, b) => {
      const aValue = a[sortedColumn]
      const bValue = b[sortedColumn]

      if (aValue === bValue) return 0

      const comparison =
        typeof aValue === "string" && typeof bValue === "string"
          ? aValue.localeCompare(bValue)
          : aValue < bValue
            ? -1
            : 1

      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [data, sortedColumn, sortDirection, columns])

  const handleSort = (key: string) => {
    if (sortedColumn === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortedColumn(key)
      setSortDirection("asc")
    }
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(sortedData.length / pageSize)

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return sortedData.slice(start, end)
  }, [sortedData, currentPage, pageSize])

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const previousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  return {
    sortedData,
    sortedColumn,
    sortDirection,
    handleSort,
    paginatedData,
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    previousPage,
  }
}

import { useState } from "react"

export interface UsePaginationReturn {
  page: number
  pageSize: number
  totalPages: number
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  queryParams: {
    page: number
    page_size: number
  }
}

export interface UsePaginationOptions {
  initialPage?: number
  initialPageSize?: number
}

export function usePagination(
  totalItems: number,
  options: UsePaginationOptions = {}
): UsePaginationReturn {
  const { initialPage = 1, initialPageSize = 25 } = options
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const totalPages = Math.ceil(totalItems / pageSize)

  const queryParams = {
    page,
    page_size: pageSize,
  }

  return {
    page,
    pageSize,
    totalPages,
    setPage,
    setPageSize,
    queryParams,
  }
}

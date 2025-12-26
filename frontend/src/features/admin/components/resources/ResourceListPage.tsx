import { useState, useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MainLayout } from "../layout/MainLayout"
import { Breadcrumbs } from "../layout/Breadcrumbs"
import { SearchBar } from "../data-display/SearchBar"
import { DataTable } from "../data-display/DataTable"
import { Pagination } from "../data-display/Pagination"
import { EmptyState } from "../data-display/EmptyState"
import { useResource } from "@/features/admin/hooks/useResource"
import { useTable } from "@/features/admin/hooks/useTable"
import type { ResourceConfig } from "@/lib/admin/resource-config"
import { createTableColumns } from "@/lib/admin/resource-config"
import { usePermissions } from "@/features/admin/hooks/usePermissions"

interface ResourceListPageProps<T extends Record<string, any>> {
  config: ResourceConfig<T>
}

export function ResourceListPage<T extends Record<string, any>>({
  config,
}: ResourceListPageProps<T>) {
  const { t } = useTranslation(["common"])
  const navigate = useNavigate()
  const { items, loading, error } = useResource<T>({
    resource: config,
    basePath: config.endpoint,
  })

  const [searchQuery, setSearchQuery] = useState("")
  const { hasPermission } = usePermissions()

  const tableColumns = useMemo(() => {
    const cols = createTableColumns<T>(config)
    return cols.map((col) => ({
      key: String(col.key),
      label: col.label,
      render: col.render
        ? (value: any, row: T) => col.render!(value, row, 0)
        : undefined,
      sortable: true,
    }))
  }, [config])

  const filteredData = useMemo(() => {
    if (!searchQuery || !config.searchFields) return items

    const query = searchQuery.toLowerCase()
    return items.filter((item) =>
      config.searchFields!.some((field) => {
        const value = item[field]
        return value && String(value).toLowerCase().includes(query)
      })
    )
  }, [items, searchQuery, config.searchFields])

  const {
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
  } = useTable<T>({
    data: filteredData,
    columns: tableColumns,
    pageSize: config.initialPageSize || 10,
  })

  const canCreate = !config.permissions?.create || hasPermission(config.permissions.create)

  if (error) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-destructive">{error}</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{config.listTitle || config.namePlural}</h1>
            <Breadcrumbs
              items={[
                { label: t("common:labels.dashboard"), href: "/admin/dashboard" },
                { label: config.listTitle || config.namePlural },
              ]}
            />
          </div>
          {canCreate && (
            <Button asChild>
              <Link to={`${config.endpoint.replace(/\/$/, "")}/new`}>
                <Plus className="mr-2 h-4 w-4" />
                {t("common:actions.create")} {config.name}
              </Link>
            </Button>
          )}
        </div>

        {config.searchFields && (
          <div className="flex items-center gap-4">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={`${t("common:actions.search")} ${config.namePlural}...`}
              className="max-w-sm"
            />
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t("common:messages.loading")}</p>
          </div>
        ) : sortedData.length === 0 ? (
          <EmptyState
            title={config.emptyMessage || t("common:messages.no_data")}
            description={config.emptyDescription || t("common:messages.no_data")}
            action={
              canCreate
                ? {
                    label: `${t("common:actions.create")} ${config.name}`,
                    onClick: () => {
                      navigate(`${config.endpoint.replace(/\/$/, "")}/new`)
                    },
                  }
                : undefined
            }
          />
        ) : (
          <>
            <DataTable
              data={paginatedData}
              columns={tableColumns}
              loading={loading}
              onSort={handleSort}
              sortedColumn={sortedColumn}
              sortDirection={sortDirection}
              rowKey={config.rowKey || ((row: T) => row.id)}
              onRowClick={(row) => {
                const id = config.rowKey ? config.rowKey(row) : row.id
                // Navegar usando React Router (sem reload da página)
                navigate(`${config.endpoint.replace(/\/$/, "")}/${id}`)
              }}
            />
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
                onNext={nextPage}
                onPrevious={previousPage}
              />
            )}
          </>
        )}
      </div>
    </MainLayout>
  )
}

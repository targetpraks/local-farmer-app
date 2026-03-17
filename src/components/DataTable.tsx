'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty } from '@/components/ui/Table'
import { Pagination } from './Pagination'
import { SearchInput } from './SearchInput'
import { FilterDropdown, FilterGroup } from './FilterDropdown'
import { cn } from '@/utils/cn'

export interface Column<T> {
  key: keyof T | string
  header: string
  sortable?: boolean
  render?: (row: T) => React.ReactNode
  width?: string
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  searchable?: boolean
  searchKeys?: (keyof T)[]
  filters?: FilterGroup[]
  pagination?: {
    pageSize: number
    currentPage: number
    total: number
    onPageChange: (page: number) => void
  }
  onRowClick?: (row: T) => void
  emptyMessage?: string
  isLoading?: boolean
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  searchable,
  searchKeys,
  filters,
  pagination,
  onRowClick,
  emptyMessage = 'No data available',
  isLoading,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof T | string; direction: 'asc' | 'desc' } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSort = (key: keyof T | string) => {
    if (sortConfig?.key === key) {
      setSortConfig({
        key,
        direction: sortConfig.direction === 'asc' ? 'desc' : 'asc',
      })
    } else {
      setSortConfig({ key, direction: 'asc' })
    }
  }

  const filteredData = data.filter((row) => {
    if (!searchQuery || !searchKeys) return true
    
    return searchKeys.some((key) => {
      const value = row[key]
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchQuery.toLowerCase())
      }
      return false
    })
  })

  const sortedData = sortConfig
    ? [...filteredData].sort((a, b) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]
        
        if (aValue === bValue) return 0
        if (aValue === null || aValue === undefined) return 1
        if (bValue === null || bValue === undefined) return -1
        
        const comparison = aValue < bValue ? -1 : 1
        return sortConfig.direction === 'asc' ? comparison : -comparison
      })
    : filteredData

  const paginatedData = pagination
    ? sortedData.slice(
        (pagination.currentPage - 1) * pagination.pageSize,
        pagination.currentPage * pagination.pageSize
      )
    : sortedData

  const totalPages = pagination ? Math.ceil(filteredData.length / pagination.pageSize) : 1

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      {(searchable || filters) && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {searchable && (
            <SearchInput
              placeholder="Search..."
              onSearch={setSearchQuery}
              className="w-full sm:w-96"
            />
          )}
          {filters && filters.length > 0 && (
            <FilterDropdown filters={filters} />
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <Table>
          <TableHead>
            <tr>
              {columns.map((column) => (
                <TableHeader
                  key={String(column.key)}
                  onClick={column.sortable ? () => handleSort(column.key) : undefined}
                  className={cn(column.width && column.width)}
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {column.sortable && (
                      <span className="inline-flex flex-col">
                        <ChevronUp
                          className={cn(
                            'h-3 w-3 -mb-1',
                            sortConfig?.key === column.key && sortConfig.direction === 'asc'
                              ? 'text-green-600'
                              : 'text-gray-400'
                          )}
                        />
                        <ChevronDown
                          className={cn(
                            'h-3 w-3',
                            sortConfig?.key === column.key && sortConfig.direction === 'desc'
                              ? 'text-green-600'
                              : 'text-gray-400'
                          )}
                        />
                      </span>
                    )}
                  </div>
                </TableHeader>
              ))}
            </tr>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-8 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableEmpty colSpan={columns.length} message={emptyMessage} />
            ) : (
              paginatedData.map((row) => (
                <TableRow
                  key={keyExtractor(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((column) => (
                    <TableCell key={`${keyExtractor(row)}-${String(column.key)}`}>
                      {column.render
                        ? column.render(row)
                        : String(row[column.key] ?? '-')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {pagination && totalPages > 1 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={totalPages}
            onPageChange={pagination.onPageChange}
          />
        )}
      </div>
    </div>
  )
}

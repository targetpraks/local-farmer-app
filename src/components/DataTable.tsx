'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Download, 
  Filter, 
  X,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react'
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
  filterable?: boolean
  filters?: { key: string; label: string; options: string[] }[]
  pagination?: {
    pageSize: number
    currentPage: number
    total: number
    onPageChange: (page: number) => void
  }
  onRowClick?: (row: T) => void
  emptyMessage?: string
  isLoading?: boolean
  exportable?: boolean
  title?: string
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  searchable,
  searchKeys,
  filterable,
  filters,
  pagination,
  onRowClick,
  emptyMessage = 'No data available',
  isLoading,
  exportable,
  title,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof T | string; direction: 'asc' | 'desc' } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [showFilters, setShowFilters] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 150)
    return () => clearTimeout(timer)
  }, [searchQuery])

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

  const handleExport = () => {
    const headers = columns.map(c => c.header).join(',')
    const rows = data.map(row => 
      columns.map(c => {
        const value = row[c.key as string]
        return value != null ? String(value) : ''
      }).join(',')
    ).join('\n')
    
    const csv = `${headers}\n${rows}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || 'data'}.csv`
    a.click()
  }

  const clearFilters = () => {
    setActiveFilters({})
    setSearchQuery('')
    setSortConfig(null)
  }

  // Filter and search data
  let filteredData = data

  if (debouncedSearch && searchKeys) {
    filteredData = filteredData.filter((row) =>
      searchKeys.some((key) => {
        const value = row[key]
        if (typeof value === 'string') {
          return value.toLowerCase().includes(debouncedSearch.toLowerCase())
        }
        return false
      })
    )
  }

  // Apply custom filters
  Object.entries(activeFilters).forEach(([key, value]) => {
    if (value) {
      filteredData = filteredData.filter(row => {
        const rowValue = row[key]
        return String(rowValue).toLowerCase() === value.toLowerCase()
      })
    }
  })

  // Sort data
  const sortedData = sortConfig
    ? [...filteredData].sort((a, b) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]
        
        if (aValue === bValue) return 0
        if (aValue == null) return 1
        if (bValue == null) return -1
        
        const comparison = aValue < bValue ? -1 : 1
        return sortConfig.direction === 'asc' ? comparison : -comparison
      })
    : filteredData

  // Paginate
  const paginatedData = pagination
    ? sortedData.slice(
        (pagination.currentPage - 1) * pagination.pageSize,
        pagination.currentPage * pagination.pageSize
      )
    : sortedData

  const totalPages = pagination ? Math.ceil(filteredData.length / pagination.pageSize) : 1
  const hasActiveFilters = debouncedSearch || Object.values(activeFilters).some(Boolean)

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="h-10 w-64 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse ml-auto" />
          </div>
        </div>
        <div className="p-8 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-12 flex-1 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          {searchable && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded"
                >
                  <X className="h-3 w-3 text-gray-400" />
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Filter Toggle */}
            {filterable && filters && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  showFilters && filters.length > 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                )}
              >
                <Filter className="h-4 w-4" />
                Filters
                {Object.values(activeFilters).filter(Boolean).length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-green-600 text-white text-xs rounded-full">
                    {Object.values(activeFilters).filter(Boolean).length}
                  </span>
                )}
              </button>
            )}

            {/* Export */}
            {exportable && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            )}

            {/* Results count */}
            <span className="text-sm text-gray-500 hidden sm:inline">
              {filteredData.length} results
            </span>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && filters && filters.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filters.map((filter) => (
              <div key={filter.key}>
                <label className="block text-xs font-medium text-gray-700 mb-1">{filter.label}</label>
                <select
                  value={activeFilters[filter.key] || ''}
                  onChange={(e) => setActiveFilters(prev => ({ ...prev, [filter.key]: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                >
                  <option value="">All</option>
                  {filter.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* Active filters bar */}
        {hasActiveFilters && (
          <div className="mt-4 pt-3 border-t border-gray-200 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500">Active:</span>
            {debouncedSearch && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                Search: {debouncedSearch}
                <button onClick={() => setSearchQuery('')} className="hover:text-green-900"><X className="h-3 w-3" /></button>
              </span>
            )}
            {Object.entries(activeFilters).filter(([,v]) => v).map(([key, value]) => (
              <span key={key} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                {filters?.find(f => f.key === key)?.label}: {value}
                <button 
                  onClick={() => setActiveFilters(prev => ({ ...prev, [key]: '' }))}
                  className="hover:text-blue-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  scope="col"
                  className={cn(
                    'px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider',
                    column.sortable && 'cursor-pointer hover:bg-gray-100 transition-colors',
                    column.width
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {column.sortable && (
                      <span className="inline-flex flex-col -space-y-1">
                        <ChevronUp className={cn(
                          'h-3 w-3 transition-colors',
                          sortConfig?.key === column.key && sortConfig.direction === 'asc'
                            ? 'text-green-600'
                            : 'text-gray-300'
                        )} />
                        <ChevronDown className={cn(
                          'h-3 w-3 transition-colors',
                          sortConfig?.key === column.key && sortConfig.direction === 'desc'
                            ? 'text-green-600'
                            : 'text-gray-300'
                        )} />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center"
                >
                  <div className="flex flex-col items-center">
                    <Search className="h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">{emptyMessage}</p>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="mt-2 text-sm text-green-600 hover:text-green-700 font-medium"
                      >
                        Clear filters to see all results
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-green-50'
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={`${keyExtractor(row)}-${String(column.key)}`}
                      className="px-6 py-4 whitespace-nowrap"
                    >
                      {column.render ? (
                        column.render(row)
                      ) : (
                        <span className="text-sm text-gray-900">
                          {String(row[column.key] ?? '-')}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50/50">
          <div className="text-sm text-gray-500">
            Showing {(pagination.currentPage - 1) * pagination.pageSize + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.pageSize, filteredData.length)} of{' '}
            {filteredData.length} results
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => pagination.onPageChange(page)}
                  className={cn(
                    'w-10 h-10 rounded-lg text-sm font-medium transition-colors',
                    pagination.currentPage === page
                      ? 'bg-green-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  )}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === totalPages}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

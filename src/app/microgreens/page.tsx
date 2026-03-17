'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Leaf } from 'lucide-react'
import { DataTable } from '@/components/DataTable'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { EmptyState } from '@/components/EmptyState'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Microgreen, PaginatedResponse } from '@/types'

export default function MicrogreensPage() {
  const router = useRouter()
  const [microgreens, setMicrogreens] = useState<Microgreen[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    fetchMicrogreens()
  }, [page])

  const fetchMicrogreens = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/microgreens')
      if (!response.ok) throw new Error('Failed to fetch microgreens')
      const result = await response.json()
      setMicrogreens(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load microgreens')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/microgreens/${deleteId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete microgreen')
      await fetchMicrogreens()
      setDeleteId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete microgreen')
    } finally {
      setIsDeleting(false)
    }
  }

  const columns = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'variety', header: 'Variety', sortable: true },
    { 
      key: 'growTime', 
      header: 'Grow Time', 
      sortable: true,
      render: (row: Microgreen) => `${row.growTime} days`
    },
    { 
      key: 'yieldPerTray', 
      header: 'Yield', 
      sortable: true,
      render: (row: Microgreen) => `${row.yieldPerTray}g`
    },
    { 
      key: 'seedingDensity', 
      header: 'Seeding', 
      sortable: true,
      render: (row: Microgreen) => `${row.seedingDensity}g/tray`
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Microgreen) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/microgreens/${row.id}`)
            }}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setDeleteId(row.id)
            }}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  const totalPages = Math.ceil(microgreens.length / pageSize)
  const paginatedData = microgreens.slice((page - 1) * pageSize, page * pageSize)

  if (isLoading && microgreens.length === 0) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Microgreens</h1>
          <p className="text-gray-500">Manage your microgreen varieties and growing details</p>
        </div>
        <Link href="/microgreens/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Microgreen
          </Button>
        </Link>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchMicrogreens} />}

      {microgreens.length === 0 && !isLoading ? (
        <EmptyState
          title="No microgreens yet"
          description="Start by adding your first microgreen variety to the system."
          icon={<Leaf className="h-12 w-12 text-gray-400" />}
          action={{
            label: 'Add Microgreen',
            href: '/microgreens/new',
            onClick: () => {}
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={paginatedData}
          keyExtractor={(row) => row.id}
          searchable
          searchKeys={['name', 'variety']}
          onRowClick={(row) => router.push(`/microgreens/${row.id}`)}
          emptyMessage="No microgreens found"
          pagination={{
            pageSize,
            currentPage: page,
            total: microgreens.length,
            onPageChange: setPage,
          }}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Microgreen"
        message="Are you sure you want to delete this microgreen? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  )
}

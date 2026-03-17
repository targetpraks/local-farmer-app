'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, FlaskConical } from 'lucide-react'
import { DataTable } from '@/components/DataTable'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { EmptyState } from '@/components/EmptyState'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { MixWithComponents } from '@/types'

export default function MixesPage() {
  const router = useRouter()
  const [mixes, setMixes] = useState<MixWithComponents[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    fetchMixes()
  }, [page])

  const fetchMixes = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/mixes')
      if (!response.ok) throw new Error('Failed to fetch mixes')
      const result = await response.json()
      setMixes(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mixes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/mixes/${deleteId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete mix')
      await fetchMixes()
      setDeleteId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete mix')
    } finally {
      setIsDeleting(false)
    }
  }

  const columns = [
    { key: 'name', header: 'Name', sortable: true },
    { 
      key: 'components', 
      header: 'Components', 
      sortable: false,
      render: (row: MixWithComponents) => (
        <div className="flex flex-wrap gap-1">
          {row.components?.slice(0, 3).map((comp) => (
            <Badge key={comp.id} variant="default">
              {comp.microgreen?.name} ({comp.percentage}%)
            </Badge>
          ))}
          {row.components?.length > 3 && (
            <Badge variant="default">+{row.components.length - 3} more</Badge>
          )}
        </div>
      )
    },
    { 
      key: 'totalWeight', 
      header: 'Total Weight', 
      sortable: true,
      render: (row: MixWithComponents) => `${row.totalWeight}g`
    },
    { 
      key: 'servingSize', 
      header: 'Serving', 
      sortable: true,
      render: (row: MixWithComponents) => `${row.servingSize}g`
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: MixWithComponents) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/mixes/${row.id}`)
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

  const totalPages = Math.ceil(mixes.length / pageSize)
  const paginatedData = mixes.slice((page - 1) * pageSize, page * pageSize)

  if (isLoading && mixes.length === 0) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mixes</h1>
          <p className="text-gray-500">Manage your custom microgreen mixes and blends</p>
        </div>
        <Link href="/mixes/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Mix
          </Button>
        </Link>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchMixes} />}

      {mixes.length === 0 && !isLoading ? (
        <EmptyState
          title="No mixes yet"
          description="Create your first custom microgreen blend."
          icon={<FlaskConical className="h-12 w-12 text-gray-400" />}
          action={{
            label: 'Create Mix',
            href: '/mixes/new',
            onClick: () => {}
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={paginatedData}
          keyExtractor={(row) => row.id}
          searchable
          searchKeys={['name', 'description']}
          onRowClick={(row) => router.push(`/mixes/${row.id}`)}
          emptyMessage="No mixes found"
          pagination={{
            pageSize,
            currentPage: page,
            total: mixes.length,
            onPageChange: setPage,
          }}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Mix"
        message="Are you sure you want to delete this mix? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  )
}

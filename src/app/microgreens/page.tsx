'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Leaf, Calculator, TrendingUp, FlaskConical } from 'lucide-react'
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

  const getYieldRateColor = (rate: number) => {
    if (rate < 400) return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', dot: 'bg-red-600', label: 'Terrible' }
    if (rate < 600) return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', dot: 'bg-yellow-600', label: 'OK' }
    if (rate < 800) return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', dot: 'bg-blue-600', label: 'Good' }
    return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', dot: 'bg-green-600', label: 'Great' }
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
      key: 'seedingDensity', 
      header: 'Seeding', 
      sortable: true,
      render: (row: Microgreen) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-amber-100 text-amber-800 border border-amber-200">
          <span className="w-2 h-2 bg-amber-600 rounded-full mr-1.5"></span>
          {row.seedingDensity}g/tray
        </span>
      )
    },
    { 
      key: 'yieldPerTray', 
      header: 'Yield', 
      sortable: true,
      render: (row: Microgreen) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
          <span className="w-2 h-2 bg-green-600 rounded-full mr-1.5"></span>
          {row.yieldPerTray}g
        </span>
      )
    },
    { 
      key: 'yieldRate', 
      header: 'Yield Rate', 
      sortable: true,
      render: (row: Microgreen) => {
        const rate = Math.round((row.yieldPerTray / row.seedingDensity) * 100)
        const colors = getYieldRateColor(rate)
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
            <span className={`w-2 h-2 ${colors.dot} rounded-full mr-1.5`}></span>
            {rate}% ({colors.label})
          </span>
        )
      }
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
      {/* Header with quick links */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">🌱 Microgreens</h1>
            <p className="text-green-100 mt-1">Manage your varieties • {microgreens.length} types available</p>
          </div>
          <Link href="/microgreens/new">
            <Button className="bg-white text-green-700 hover:bg-green-50">
              <Plus className="h-4 w-4 mr-2" />
              Add Microgreen
            </Button>
          </Link>
        </div>
        
        {/* Quick action links */}
        <div className="flex gap-3 mt-4">
          <Link href="/costing" className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors">
            <Calculator className="h-4 w-4" />
            Calculate Costs
          </Link>
          <Link href="/pricing" className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors">
            <TrendingUp className="h-4 w-4" />
            View Pricing
          </Link>
          <Link href="/mixes" className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors">
            <FlaskConical className="h-4 w-4" />
            Create Mix
          </Link>
        </div>
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

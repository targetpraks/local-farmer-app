'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, FlaskConical, Leaf, Calculator, TrendingUp, ArrowRight } from 'lucide-react'
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
    { 
      key: 'name', 
      header: 'Name', 
      sortable: true,
      render: (row: MixWithComponents) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          {row.description && (
            <div className="text-sm text-gray-500 mt-0.5">{row.description}</div>
          )}
        </div>
      )
    },
    { 
      key: 'components', 
      header: 'Components', 
      sortable: false,
      render: (row: MixWithComponents) => (
        <div className="flex flex-wrap gap-1">
          {row.components?.map((comp) => (
            <Badge key={comp.id} variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
              {comp.microgreen?.name} ({comp.percentage}%)
            </Badge>
          ))}
        </div>
      )
    },
    { 
      key: 'costPerGram', 
      header: 'Cost / Gram', 
      sortable: true,
      render: (row: MixWithComponents) => {
        // Calculate blended cost based on component costs and yields
        let totalCost = 0
        let totalYield = 0
        
        row.components?.forEach((comp) => {
          const microgreen = comp.microgreen
          if (microgreen) {
            const seedCost = microgreen.defaultSeedCostPerGram || 0
            const yieldPerTray = microgreen.yieldPerTray || 1
            const percentage = comp.percentage / 100
            
            // Cost for this component = seed cost * percentage
            totalCost += seedCost * percentage
            // Weight contribution = yield * percentage
            totalYield += yieldPerTray * percentage
          }
        })
        
        const costPerGram = totalYield > 0 ? totalCost / totalYield : 0
        
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-semibold bg-amber-100 text-amber-900 border border-amber-200">
            R{costPerGram.toFixed(2)}/g
          </span>
        )
      }
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
      {/* Header with quick links */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">🧪 Mixes</h1>
            <p className="text-amber-100 mt-1">Custom microgreen blends • Components must be from your microgreen list</p>
          </div>
          <Link href="/mixes/new">
            <Button className="bg-white text-amber-600 hover:bg-amber-50">
              <Plus className="h-4 w-4 mr-2" />
              Create Mix
            </Button>
          </Link>
        </div>
        
        {/* Quick action links */}
        <div className="flex gap-3 mt-4">
          <Link href="/microgreens" className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors">
            <Leaf className="h-4 w-4" />
            View Microgreens
            <ArrowRight className="h-3 w-3" />
          </Link>
          <Link href="/costing" className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors">
            <Calculator className="h-4 w-4" />
            Calculate Costs
          </Link>
          <Link href="/pricing" className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors">
            <TrendingUp className="h-4 w-4" />
            View Pricing
          </Link>
        </div>
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

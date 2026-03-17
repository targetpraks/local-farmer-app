'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Percent, DollarSign, Target } from 'lucide-react'
import { DataTable } from '@/components/DataTable'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { EmptyState } from '@/components/EmptyState'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { CustomerTier } from '@/types'

export default function PricingPage() {
  const router = useRouter()
  const [tiers, setTiers] = useState<CustomerTier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    fetchTiers()
  }, [page])

  const fetchTiers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/pricing/tiers')
      if (!response.ok) throw new Error('Failed to fetch pricing tiers')
      const result = await response.json()
      setTiers(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pricing tiers')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/pricing/tiers/${deleteId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete pricing tier')
      await fetchTiers()
      setDeleteId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pricing tier')
    } finally {
      setIsDeleting(false)
    }
  }

  const getMarkupTypeIcon = (type: string) => {
    switch (type) {
      case 'PERCENTAGE':
        return <Percent className="h-4 w-4" />
      case 'FIXED_AMOUNT':
        return <DollarSign className="h-4 w-4" />
      case 'MARGIN_TARGET':
        return <Target className="h-4 w-4" />
      default:
        return <Percent className="h-4 w-4" />
    }
  }

  const getMarkupTypeLabel = (type: string) => {
    switch (type) {
      case 'PERCENTAGE':
        return 'Percentage'
      case 'FIXED_AMOUNT':
        return 'Fixed Amount'
      case 'MARGIN_TARGET':
        return 'Target Margin'
      default:
        return type
    }
  }

  const columns = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'code', header: 'Code', sortable: true },
    { 
      key: 'markupType', 
      header: 'Markup Type', 
      sortable: true,
      render: (row: CustomerTier) => (
        <div className="flex items-center gap-2">
          {getMarkupTypeIcon(row.markupType)}
          <span>{getMarkupTypeLabel(row.markupType)}</span>
        </div>
      )
    },
    { 
      key: 'markupValue', 
      header: 'Markup Value', 
      sortable: true,
      render: (row: CustomerTier) => (
        <span>
          {row.markupType === 'PERCENTAGE' || row.markupType === 'FIXED_PRICE'
            ? `${row.markupValue}%`
            : `$${row.markupValue.toFixed(2)}`
          }
        </span>
      )
    },
    { 
      key: 'minimumMargin', 
      header: 'Min Margin', 
      sortable: true,
      render: (row: CustomerTier) => (
        row.minimumMargin ? `${row.minimumMargin}%` : '-'
      )
    },
    { 
      key: 'volumeDiscount', 
      header: 'Volume Discount', 
      render: (row: CustomerTier) => (
        row.volumeDiscountThreshold && row.volumeDiscountPercent ? (
          <Badge variant="success">
            {row.volumeDiscountPercent}% above ${row.volumeDiscountThreshold}
          </Badge>
        ) : (
          <span className="text-gray-400">-</span>
        )
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: CustomerTier) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/pricing/${row.id}`)
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

  const totalPages = Math.ceil(tiers.length / pageSize)
  const paginatedData = tiers.slice((page - 1) * pageSize, page * pageSize)

  if (isLoading && tiers.length === 0) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pricing Tiers</h1>
          <p className="text-gray-500">Manage customer tiers and pricing rules</p>
        </div>
        <Link href="/pricing/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Pricing Tier
          </Button>
        </Link>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchTiers} />}

      {tiers.length === 0 && !isLoading ? (
        <EmptyState
          title="No pricing tiers yet"
          description="Create your first pricing tier to define markup rules for different customer types."
          icon={<Percent className="h-12 w-12 text-gray-400" />}
          action={{
            label: 'Create Pricing Tier',
            href: '/pricing/new',
            onClick: () => {}
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={paginatedData}
          keyExtractor={(row) => row.id}
          searchable
          searchKeys={['name', 'code']}
          onRowClick={(row) => router.push(`/pricing/${row.id}`)}
          emptyMessage="No pricing tiers found"
          pagination={{
            pageSize,
            currentPage: page,
            total: tiers.length,
            onPageChange: setPage,
          }}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Pricing Tier"
        message="Are you sure you want to delete this pricing tier? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Package, Calendar, Users, Gift, Clock, Zap } from 'lucide-react'
import { DataTable } from '@/components/DataTable'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { EmptyState } from '@/components/EmptyState'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { SubscriptionPlanWithTier } from '@/types'

// Subscription duration discounts
const DURATION_DISCOUNTS = [
  { months: 3, weeks: 12, discount: 4, label: '3 Months', icon: Clock, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { months: 6, weeks: 26, discount: 6, label: '6 Months', icon: Calendar, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { months: 12, weeks: 52, discount: 10, label: '12 Months', icon: Zap, color: 'bg-amber-100 text-amber-700 border-amber-200' },
]

export default function SubscriptionsPage() {
  const router = useRouter()
  const [subscriptions, setSubscriptions] = useState<SubscriptionPlanWithTier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    fetchSubscriptions()
  }, [page])

  const fetchSubscriptions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/subscriptions')
      if (!response.ok) throw new Error('Failed to fetch subscription plans')
      const result = await response.json()
      setSubscriptions(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription plans')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/subscriptions/${deleteId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete subscription plan')
      await fetchSubscriptions()
      setDeleteId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subscription plan')
    } finally {
      setIsDeleting(false)
    }
  }

  const getDurationLabel = (minWeeks: number, maxWeeks?: number | null) => {
    if (maxWeeks && maxWeeks !== minWeeks) {
      return `${minWeeks}-${maxWeeks} weeks`
    }
    return `${minWeeks} weeks`
  }

  const getBestDiscount = (sub: SubscriptionPlanWithTier) => {
    const discounts = [
      { weeks: 4, value: sub.discount4Weeks },
      { weeks: 8, value: sub.discount8Weeks },
      { weeks: 12, value: sub.discount12Weeks },
      { weeks: 26, value: sub.discount26Weeks },
      { weeks: 52, value: sub.discount52Weeks },
    ].filter(d => d.value && d.value > 0)
    
    if (discounts.length === 0) return null
    const best = discounts.reduce((max, d) => d.value! > max.value! ? d : max)
    return `Up to ${best.value}% off`
  }

  const columns = [
    { key: 'name', header: 'Plan Name', sortable: true },
    { 
      key: 'tier', 
      header: 'Customer Tier', 
      sortable: true,
      render: (row: SubscriptionPlanWithTier) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-400" />
          <span>{row.tier.name}</span>
        </div>
      )
    },
    { 
      key: 'duration', 
      header: 'Duration', 
      sortable: true,
      render: (row: SubscriptionPlanWithTier) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>{getDurationLabel(row.minDurationWeeks, row.maxDurationWeeks)}</span>
        </div>
      )
    },
    { 
      key: 'weeklyPrice', 
      header: 'Weekly Price', 
      sortable: true,
      render: (row: SubscriptionPlanWithTier) => (
        <span className="font-medium">${row.weeklyPrice.toFixed(2)}</span>
      )
    },
    { 
      key: 'weeklyServings', 
      header: 'Servings/Week', 
      sortable: true,
      render: (row: SubscriptionPlanWithTier) => (
        <span>{row.weeklyServings} × {row.servingSizeGrams}g</span>
      )
    },
    { 
      key: 'discount', 
      header: 'Best Discount', 
      render: (row: SubscriptionPlanWithTier) => {
        const discount = getBestDiscount(row)
        return discount ? (
          <Badge variant="success">{discount}</Badge>
        ) : (
          <span className="text-gray-400">-</span>
        )
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: SubscriptionPlanWithTier) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/subscriptions/${row.id}`)
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

  const totalPages = Math.ceil(subscriptions.length / pageSize)
  const paginatedData = subscriptions.slice((page - 1) * pageSize, page * pageSize)

  if (isLoading && subscriptions.length === 0) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <Gift className="h-8 w-8 text-yellow-300" />
          <div>
            <h1 className="text-3xl font-bold">Subscription Plans</h1>
            <p className="text-purple-100 mt-1">Create flexible plans with duration-based discounts. Keep customers coming back!</p>
          </div>
        </div>
      </div>

      {/* Duration Discounts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DURATION_DISCOUNTS.map((tier) => (
          <div key={tier.months} className={`p-4 rounded-xl border-2 ${tier.color} flex items-center gap-4`}>
            <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm">
              <tier.icon className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{tier.discount}%</div>
              <div className="text-sm font-medium">{tier.label}</div>
              <div className="text-xs opacity-75">{tier.weeks} weeks</div>
            </div>
          </div>
        ))}
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchSubscriptions} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Active Plans</h2>
          <p className="text-gray-500">{subscriptions.length} subscription plans available</p>
        </div>
        <Link href="/subscriptions/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Subscription
          </Button>
        </Link>
      </div>

      {subscriptions.length === 0 && !isLoading ? (
        <EmptyState
          title="No subscription plans yet"
          description="Create your first subscription plan to offer recurring deliveries to customers."
          icon={<Package className="h-12 w-12 text-gray-400" />}
          action={{
            label: 'Create Subscription',
            href: '/subscriptions/new',
            onClick: () => {}
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={paginatedData}
          keyExtractor={(row) => row.id}
          searchable
          searchKeys={['name', 'sku']}
          onRowClick={(row) => router.push(`/subscriptions/${row.id}`)}
          emptyMessage="No subscription plans found"
          pagination={{
            pageSize,
            currentPage: page,
            total: subscriptions.length,
            onPageChange: setPage,
          }}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Subscription Plan"
        message="Are you sure you want to delete this subscription plan? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  )
}

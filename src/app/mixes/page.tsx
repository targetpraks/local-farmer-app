'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Package, Leaf, Scale, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { EmptyState } from '@/components/EmptyState'
import { ConfirmDialog } from '@/components/ConfirmDialog'

interface MixComponent {
  id: string
  mixId: string
  microgreenId: string
  percentage: number
  weightGrams: number
  microgreen: {
    id: string
    sku: string
    name: string
    variety: string
    description: string | null
  }
}

interface Mix {
  id: string
  sku: string
  name: string
  description: string | null
  totalWeight: number
  servingSize: number
  servingsPerBatch: number
  totalCostPerBatch: number | null
  costPerServing: number | null
  imageUrl: string | null
  isActive: boolean
  isTemplate: boolean
  createdAt: string
  updatedAt: string
  components: MixComponent[]
  _count?: {
    costings: number
  }
}

export default function MixesPage() {
  const router = useRouter()
  const [mixes, setMixes] = useState<Mix[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchMixes()
  }, [])

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

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Package className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Mixes</h1>
              <p className="text-green-100 mt-1">Blended microgreen products &bull; {mixes.length} mixes available</p>
            </div>
          </div>
          <Link href="/mixes/new">
            <Button className="bg-white text-green-600 hover:bg-green-50">
              <Plus className="h-4 w-4 mr-2" />
              New Mix
            </Button>
          </Link>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchMixes} />}

      {mixes.length === 0 ? (
        <EmptyState
          title="No mixes yet"
          description="Create your first microgreen mix to offer blended products to your customers."
          icon={<Package className="h-12 w-12 text-gray-400" />}
          action={{
            label: 'Create Mix',
            href: '/mixes/new',
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mixes.map((mix) => (
            <div
              key={mix.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/mixes/${mix.id}`)}
            >
              <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-green-100">{mix.sku}</span>
                      <Badge
                        variant="default"
                        className="bg-white/20 text-white text-xs"
                      >
                        {mix.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-white mt-1">{mix.name}</h3>
                    {mix.description && (
                      <p className="text-green-100 text-sm mt-1 line-clamp-2">{mix.description}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <Scale className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                    <div className="text-lg font-semibold text-gray-900">{mix.totalWeight}g</div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <Leaf className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                    <div className="text-lg font-semibold text-gray-900">{mix.servingSize}g</div>
                    <div className="text-xs text-gray-500">Serving</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <Users className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                    <div className="text-lg font-semibold text-gray-900">{mix.servingsPerBatch}</div>
                    <div className="text-xs text-gray-500">Servings</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Components ({mix.components.length})
                  </div>
                  <div className="space-y-1.5">
                    {mix.components.slice(0, 4).map((comp) => (
                      <div key={comp.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 truncate flex-1">{comp.microgreen.name}</span>
                        <Badge
                          variant="default"
                          className="text-xs ml-2 shrink-0 bg-gray-100 text-gray-700"
                        >
                          {comp.percentage}%
                        </Badge>
                      </div>
                    ))}
                    {mix.components.length > 4 && (
                      <div className="text-xs text-gray-400 text-center">
                        +{mix.components.length - 4} more
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/mixes/${mix.id}`)
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteId(mix.id)
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-400">
                    {mix._count?.costings || 0} costings
                  </div>
                </div>
              </div>
            </Card>
            </div>
          ))}
        </div>
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

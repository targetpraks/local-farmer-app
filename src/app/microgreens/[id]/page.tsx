'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, TrendingUp, DollarSign } from 'lucide-react'
import { MicrogreenForm } from '@/components/forms/MicrogreenForm'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Microgreen, MicrogreenWithPrices, MicrogreenFormData } from '@/types'

export default function MicrogreenDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [microgreen, setMicrogreen] = useState<MicrogreenWithPrices | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchMicrogreen()
    }
  }, [id])

  const fetchMicrogreen = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/microgreens/${id}`)
      if (!response.ok) throw new Error('Failed to fetch microgreen')
      const result = await response.json()
      setMicrogreen(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load microgreen')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (data: MicrogreenFormData) => {
    try {
      setIsSaving(true)
      setError(null)
      
      const response = await fetch(`/api/microgreens/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Failed to update microgreen')
      }
      
      router.push('/microgreens')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update microgreen')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!microgreen && !isLoading) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Microgreen not found</h2>
        <p className="text-gray-500 mt-2">The microgreen you're looking for doesn't exist.</p>
        <Link href="/microgreens" className="text-green-600 hover:text-green-700 mt-4 inline-block">
          Back to microgreens
        </Link>
      </div>
    )
  }

  const defaultValues: MicrogreenFormData = {
    name: microgreen?.name || '',
    variety: microgreen?.variety || '',
    description: microgreen?.description || '',
    growTime: microgreen?.growTime || 7,
    yieldPerTray: microgreen?.yieldPerTray || 100,
    seedingDensity: microgreen?.seedingDensity || 20,
    defaultSeedCostPerGram: microgreen?.defaultSeedCostPerGram || undefined,
    defaultSoilCostPerTray: microgreen?.defaultSoilCostPerTray || undefined,
    defaultTrayCost: microgreen?.defaultTrayCost || undefined,
    imageUrl: microgreen?.imageUrl || '',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/microgreens">
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{microgreen?.name}</h1>
          <p className="text-gray-500">Edit microgreen details</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Grow Time</p>
              <p className="text-xl font-semibold text-gray-900">{microgreen?.growTime} days</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Yield</p>
              <p className="text-xl font-semibold text-gray-900">{microgreen?.yieldPerTray}g</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Seeding</p>
              <p className="text-xl font-semibold text-gray-900">{microgreen?.seedingDensity}g</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Price Entries</p>
              <p className="text-xl font-semibold text-gray-900">{microgreen?.supplierPrices?.length || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {error && <ErrorMessage message={error} />}

      <MicrogreenForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/microgreens')}
        isLoading={isSaving}
        error={error}
      />
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FlaskConical, Scale, Utensils } from 'lucide-react'
import { MixForm } from '@/components/forms/MixForm'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MixWithComponents, Microgreen, MixFormData } from '@/types'

export default function MixDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [mix, setMix] = useState<MixWithComponents | null>(null)
  const [microgreens, setMicrogreens] = useState<Microgreen[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchData()
    }
  }, [id])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [mixResponse, microgreensResponse] = await Promise.all([
        fetch(`/api/mixes/${id}`),
        fetch('/api/microgreens'),
      ])
      
      if (!mixResponse.ok) throw new Error('Failed to fetch mix')
      if (!microgreensResponse.ok) throw new Error('Failed to fetch microgreens')
      
      const mixResult = await mixResponse.json()
      const microgreensResult = await microgreensResponse.json()
      
      setMix(mixResult.data)
      setMicrogreens(microgreensResult.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (data: MixFormData) => {
    try {
      setIsSaving(true)
      setError(null)
      
      const response = await fetch(`/api/mixes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Failed to update mix')
      }
      
      router.push('/mixes')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update mix')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!mix && !isLoading) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Mix not found</h2>
        <p className="text-gray-500 mt-2">The mix you're looking for doesn't exist.</p>
        <Link href="/mixes" className="text-green-600 hover:text-green-700 mt-4 inline-block">
          Back to mixes
        </Link>
      </div>
    )
  }

  const defaultValues: MixFormData = {
    name: mix?.name || '',
    description: mix?.description || '',
    totalWeight: mix?.totalWeight || 100,
    servingSize: mix?.servingSize || 30,
    imageUrl: mix?.imageUrl || '',
    components: mix?.components?.map((comp) => ({
      microgreenId: comp.microgreenId,
      percentage: comp.percentage,
      weightGrams: comp.weightGrams,
    })) || [],
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/mixes">
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{mix?.name}</h1>
          <p className="text-gray-500">Edit mix details</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <FlaskConical className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Components</p>
              <p className="text-xl font-semibold text-gray-900">{mix?.components?.length || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <Scale className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Weight</p>
              <p className="text-xl font-semibold text-gray-900">{mix?.totalWeight}g</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <Utensils className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Serving Size</p>
              <p className="text-xl font-semibold text-gray-900">{mix?.servingSize}g</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Components Preview */}
      <Card title="Current Components">
        <div className="space-y-2">
          {mix?.components?.map((comp) => (
            <div key={comp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">{comp.microgreen?.name}</span>
              <div className="flex items-center gap-4">
                <Badge variant="info">{comp.percentage}%</Badge>
                <span className="text-sm text-gray-500">{comp.weightGrams}g</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {error && <ErrorMessage message={error} />}

      <MixForm
        defaultValues={defaultValues}
        microgreens={microgreens}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/mixes')}
        isLoading={isSaving}
        error={error}
      />
    </div>
  )
}

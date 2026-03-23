'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { MixForm } from '@/components/forms/MixForm'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { MixFormData, Microgreen } from '@/types'

export default function NewMixPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [microgreens, setMicrogreens] = useState<Microgreen[]>([])

  useEffect(() => {
    fetchMicrogreens()
  }, [])

  const fetchMicrogreens = async () => {
    try {
      setIsFetching(true)
      const response = await fetch('/api/microgreens')
      if (!response.ok) throw new Error('Failed to fetch microgreens')
      const result = await response.json()
      setMicrogreens(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load microgreens')
    } finally {
      setIsFetching(false)
    }
  }

  const handleSubmit = async (data: MixFormData) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/mixes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Failed to create mix')
      }
      
      router.push('/mixes')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create mix')
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return <LoadingSpinner fullScreen />
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
          <h1 className="text-2xl font-bold text-gray-900">New Mix</h1>
          <p className="text-gray-500">Create a custom microgreen blend</p>
        </div>
      </div>

      <MixForm
        microgreens={microgreens}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/mixes')}
        isLoading={isLoading}
        error={error}
      />
    </div>
  )
}

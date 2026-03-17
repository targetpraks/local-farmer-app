'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { MicrogreenForm } from '@/components/forms/MicrogreenForm'
import { MicrogreenFormData } from '@/types'

export default function NewMicrogreenPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: MicrogreenFormData) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/microgreens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Failed to create microgreen')
      }
      
      router.push('/microgreens')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create microgreen')
    } finally {
      setIsLoading(false)
    }
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
          <h1 className="text-2xl font-bold text-gray-900">New Microgreen</h1>
          <p className="text-gray-500">Add a new microgreen variety to your catalog</p>
        </div>
      </div>

      <MicrogreenForm
        onSubmit={handleSubmit}
        onCancel={() => router.push('/microgreens')}
        isLoading={isLoading}
        error={error}
      />
    </div>
  )
}

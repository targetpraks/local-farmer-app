'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SupplierForm } from '@/components/forms/SupplierForm'
import { SupplierFormData } from '@/types'

export default function NewSupplierPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: SupplierFormData) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Failed to create supplier')
      }
      
      router.push('/suppliers')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create supplier')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/suppliers">
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Supplier</h1>
          <p className="text-gray-500">Add a new supplier to your catalog</p>
        </div>
      </div>

      <SupplierForm
        onSubmit={handleSubmit}
        onCancel={() => router.push('/suppliers')}
        isLoading={isLoading}
        error={error}
      />
    </div>
  )
}

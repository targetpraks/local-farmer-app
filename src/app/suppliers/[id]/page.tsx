'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Clock, Star, DollarSign } from 'lucide-react'
import { SupplierForm } from '@/components/forms/SupplierForm'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SupplierWithPrices, SupplierFormData } from '@/types'

export default function SupplierDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [supplier, setSupplier] = useState<SupplierWithPrices | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchSupplier()
    }
  }, [id])

  const fetchSupplier = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/suppliers/${id}`)
      if (!response.ok) throw new Error('Failed to fetch supplier')
      const result = await response.json()
      setSupplier(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load supplier')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (data: SupplierFormData) => {
    try {
      setIsSaving(true)
      setError(null)
      
      const response = await fetch(`/api/suppliers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Failed to update supplier')
      }
      
      router.push('/suppliers')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update supplier')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!supplier && !isLoading) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Supplier not found</h2>
        <p className="text-gray-500 mt-2">The supplier you're looking for doesn't exist.</p>
        <Link href="/suppliers" className="text-green-600 hover:text-green-700 mt-4 inline-block">
          Back to suppliers
        </Link>
      </div>
    )
  }

  const defaultValues: SupplierFormData = {
    name: supplier?.name || '',
    contactName: supplier?.contactName || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    address: supplier?.address || '',
    website: supplier?.website || '',
    paymentTerms: supplier?.paymentTerms || '',
    leadTimeDays: supplier?.leadTimeDays || undefined,
    minOrderAmount: supplier?.minOrderAmount || undefined,
    isPreferred: supplier?.isPreferred || false,
    rating: supplier?.rating || undefined,
    notes: supplier?.notes || '',
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
          <h1 className="text-2xl font-bold text-gray-900">{supplier?.name}</h1>
          <p className="text-gray-500">Edit supplier details</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Contact</p>
              <p className="text-xl font-semibold text-gray-900 truncate">{supplier?.contactName || '-'}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Lead Time</p>
              <p className="text-xl font-semibold text-gray-900">{supplier?.leadTimeDays ? `${supplier.leadTimeDays} days` : '-'}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <Star className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Rating</p>
              <p className="text-xl font-semibold text-gray-900">{supplier?.rating || '-'}/5</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Price Entries</p>
              <p className="text-xl font-semibold text-gray-900">{supplier?.prices?.length || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Price List Preview */}
      {supplier?.prices && supplier.prices.length > 0 && (
        <Card title="Current Prices">
          <div className="space-y-2">
            {supplier.prices.map((price) => (
              <div key={price.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">{price.microgreen?.name}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">${price.unitPrice.toFixed(2)}/{price.unitType}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {error && <ErrorMessage message={error} />}

      <SupplierForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/suppliers')}
        isLoading={isSaving}
        error={error}
      />
    </div>
  )
}

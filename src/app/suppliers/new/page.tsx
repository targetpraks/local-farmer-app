'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { cn } from '@/utils/cn'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  contactName: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  paymentTerms: z.string().optional(),
  leadTimeDays: z.number().min(0, 'Lead time cannot be negative').optional(),
  minOrderAmount: z.number().min(0, 'Minimum order cannot be negative').optional(),
  isPreferred: z.boolean().optional(),
  rating: z.number().min(0).max(5, 'Rating must be between 0 and 5').optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewSupplierPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      isPreferred: false,
    },
  })

  const isPreferred = watch('isPreferred')

  const onSubmit = async (data: FormData) => {
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

  if (isLoading) {
    return <LoadingSpinner fullScreen />
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && <ErrorMessage message={error} />}
        
        <Card title="Basic Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Company Name"
              {...register('name')}
              error={errors.name?.message}
              placeholder="e.g., Green Seeds Co."
            />
            
            <Input
              label="Contact Person"
              {...register('contactName')}
              error={errors.contactName?.message}
              placeholder="e.g., John Smith"
            />
            
            <Input
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              placeholder="contact@example.com"
            />
            
            <Input
              label="Phone"
              {...register('phone')}
              error={errors.phone?.message}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </Card>

        <Card title="Address & Website">
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Address"
              {...register('address')}
              error={errors.address?.message}
              placeholder="123 Green Street, Farmville, CA 12345"
            />
            
            <Input
              label="Website"
              {...register('website')}
              error={errors.website?.message}
              placeholder="https://www.example.com"
            />
          </div>
        </Card>

        <Card title="Business Details">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Payment Terms"
              {...register('paymentTerms')}
              error={errors.paymentTerms?.message}
              placeholder="Net 30"
            />
            
            <Input
              label="Lead Time (days)"
              type="number"
              {...register('leadTimeDays', { valueAsNumber: true })}
              error={errors.leadTimeDays?.message}
            />
            
            <Input
              label="Minimum Order Amount"
              type="number"
              step="0.01"
              {...register('minOrderAmount', { valueAsNumber: true })}
              error={errors.minOrderAmount?.message}
            />
            
            <Input
              label="Rating (0-5)"
              type="number"
              step="0.1"
              min="0"
              max="5"
              {...register('rating', { valueAsNumber: true })}
              error={errors.rating?.message}
            />
            
            <div className="flex items-center md:col-span-2">
              <button
                type="button"
                onClick={() => setValue('isPreferred', !isPreferred)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
                  isPreferred ? 'bg-green-600' : 'bg-gray-200'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    isPreferred ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
              <span className="ml-3 text-sm text-gray-700">Preferred Supplier</span>
            </div>
          </div>
        </Card>

        <Card title="Notes">
          <textarea
            {...register('notes')}
            rows={4}
            className="block w-full rounded-lg border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6"
            placeholder="Additional notes about this supplier..."
          />
        </Card>

        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="secondary" onClick={() => router.push('/suppliers')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Create Supplier
          </Button>
        </div>
      </form>
    </div>
  )
}

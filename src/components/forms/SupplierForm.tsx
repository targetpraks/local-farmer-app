'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { SupplierFormData } from '@/types'
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

export interface SupplierFormProps {
  defaultValues?: Partial<SupplierFormData>
  onSubmit: (data: SupplierFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  error?: string | null
}

export function SupplierForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  error,
}: SupplierFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      isPreferred: false,
      ...defaultValues,
    },
  })

  const isPreferred = watch('isPreferred')

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  return (
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
            <input
              type="checkbox"
              checked={isPreferred || false}
              onChange={(e) => setValue('isPreferred', e.target.checked)}
              className={cn(
                'h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500',
                isPreferred ? 'bg-green-600 border-green-600' : 'bg-white border-gray-300'
              )}
            />
            <span className="ml-2 text-sm text-gray-700">Preferred Supplier</span>
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
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isLoading}>
          {defaultValues ? 'Update' : 'Create'} Supplier
        </Button>
      </div>
    </form>
  )
}

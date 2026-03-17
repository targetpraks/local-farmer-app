'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { CustomerTierFormData, MarkupType } from '@/types'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  description: z.string().optional(),
  markupType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'MARGIN_TARGET']),
  markupValue: z.number().min(0, 'Markup value cannot be negative'),
  minimumMargin: z.number().optional(),
  volumeDiscountThreshold: z.number().optional(),
  volumeDiscountPercent: z.number().min(0).max(100, 'Discount cannot exceed 100%').optional(),
})

export interface PricingTierFormProps {
  defaultValues?: Partial<CustomerTierFormData>
  onSubmit: (data: CustomerTierFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  error?: string | null
}

export function PricingTierForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  error,
}: PricingTierFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CustomerTierFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      markupType: 'PERCENTAGE',
      ...defaultValues,
    },
  })

  const markupType = watch('markupType')

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  const markupTypeOptions = [
    { value: 'PERCENTAGE', label: 'Percentage Markup' },
    { value: 'FIXED_AMOUNT', label: 'Fixed Amount' },
    { value: 'MARGIN_TARGET', label: 'Target Margin' },
  ]

  const getMarkupLabel = () => {
    switch (markupType) {
      case 'PERCENTAGE':
        return 'Markup Percentage (%)'
      case 'FIXED_AMOUNT':
        return 'Fixed Amount Markup'
      case 'MARGIN_TARGET':
        return 'Target Margin (%)'
      default:
        return 'Markup Value'
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && <ErrorMessage message={error} />}
      
      <Card title="Tier Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Tier Name"
            {...register('name')}
            error={errors.name?.message}
            placeholder="e.g., Retail Customer"
          />
          
          <Input
            label="Code"
            {...register('code')}
            error={errors.code?.message}
            placeholder="e.g., RETAIL"
          />
          
          <div className="md:col-span-2">
            <Input
              label="Description"
              {...register('description')}
              error={errors.description?.message}
              placeholder="Description of this customer tier"
            />
          </div>
        </div>
      </Card>

      <Card title="Pricing Rules">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Markup Type"
            options={markupTypeOptions}
            {...register('markupType')}
            error={errors.markupType?.message}
          />
          
          <Input
            label={getMarkupLabel()}
            type="number"
            step="0.01"
            {...register('markupValue', { valueAsNumber: true })}
            error={errors.markupValue?.message}
          />
          
          <Input
            label="Minimum Margin (%)"
            type="number"
            step="0.1"
            {...register('minimumMargin', { valueAsNumber: true })}
            error={errors.minimumMargin?.message}
          />
        </div>
      </Card>

      <Card title="Volume Discount (Optional)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Discount Threshold (amount)"
            type="number"
            step="0.01"
            {...register('volumeDiscountThreshold', { valueAsNumber: true })}
            error={errors.volumeDiscountThreshold?.message}
            hint="Order amount to qualify for discount"
          />
          
          <Input
            label="Discount Percentage (%)"
            type="number"
            step="0.1"
            min="0"
            max="100"
            {...register('volumeDiscountPercent', { valueAsNumber: true })}
            error={errors.volumeDiscountPercent?.message}
            hint="Percentage discount when threshold is met"
          />
        </div>
      </Card>

      <div className="flex items-center justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isLoading}>
          {defaultValues ? 'Update' : 'Create'} Tier
        </Button>
      </div>
    </form>
  )
}

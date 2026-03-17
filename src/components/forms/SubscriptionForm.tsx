'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { SubscriptionPlanFormData, CustomerTier, Mix } from '@/types'
import { Plus, Trash2 } from 'lucide-react'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  tierId: z.string().min(1, 'Customer tier is required'),
  minDurationWeeks: z.number().min(1, 'Minimum duration must be at least 1 week'),
  maxDurationWeeks: z.number().optional(),
  weeklyServings: z.number().min(1, 'Weekly servings must be at least 1'),
  servingSizeGrams: z.number().min(0.1, 'Serving size must be greater than 0'),
  includedMixIds: z.array(z.string()).min(1, 'At least one mix is required'),
  weeklyPrice: z.number().min(0, 'Weekly price cannot be negative'),
  setupFee: z.number().optional(),
  deliveryFee: z.number().optional(),
  discount4Weeks: z.number().min(0).max(100).optional(),
  discount8Weeks: z.number().min(0).max(100).optional(),
  discount12Weeks: z.number().min(0).max(100).optional(),
  discount26Weeks: z.number().min(0).max(100).optional(),
  discount52Weeks: z.number().min(0).max(100).optional(),
  allowPause: z.boolean().optional(),
  allowCustomization: z.boolean().optional(),
})

export interface SubscriptionFormProps {
  defaultValues?: Partial<SubscriptionPlanFormData>
  customerTiers: CustomerTier[]
  mixes: Mix[]
  onSubmit: (data: SubscriptionPlanFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  error?: string | null
}

export function SubscriptionForm({
  defaultValues,
  customerTiers,
  mixes,
  onSubmit,
  onCancel,
  isLoading,
  error,
}: SubscriptionFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SubscriptionPlanFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      minDurationWeeks: 4,
      weeklyServings: 2,
      servingSizeGrams: 30,
      includedMixIds: [],
      allowPause: true,
      allowCustomization: false,
      ...defaultValues,
    },
  })

  const includedMixIds = watch('includedMixIds') || []

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  const tierOptions = customerTiers.map((tier) => ({
    value: tier.id,
    label: `${tier.name} (${tier.code})`,
  }))

  const toggleMix = (mixId: string) => {
    const current = includedMixIds
    if (current.includes(mixId)) {
      setValue('includedMixIds', current.filter((id) => id !== mixId))
    } else {
      setValue('includedMixIds', [...current, mixId])
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && <ErrorMessage message={error} />}
      
      <Card title="Plan Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Plan Name"
            {...register('name')}
            error={errors.name?.message}
            placeholder="e.g., Weekly Microgreens Box"
          />
          
          <Select
            label="Customer Tier"
            options={tierOptions}
            {...register('tierId')}
            error={errors.tierId?.message}
            placeholder="Select a customer tier"
          />
          
          <div className="md:col-span-2">
            <Input
              label="Description"
              {...register('description')}
              error={errors.description?.message}
              placeholder="Description of this subscription plan"
            />
          </div>
        </div>
      </Card>

      <Card title="Duration & Servings">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Min Duration (weeks)"
            type="number"
            {...register('minDurationWeeks', { valueAsNumber: true })}
            error={errors.minDurationWeeks?.message}
          />
          
          <Input
            label="Max Duration (weeks, optional)"
            type="number"
            {...register('maxDurationWeeks', { valueAsNumber: true })}
            error={errors.maxDurationWeeks?.message}
          />
          
          <Input
            label="Weekly Servings"
            type="number"
            {...register('weeklyServings', { valueAsNumber: true })}
            error={errors.weeklyServings?.message}
          />
          
          <Input
            label="Serving Size (grams)"
            type="number"
            step="0.1"
            {...register('servingSizeGrams', { valueAsNumber: true })}
            error={errors.servingSizeGrams?.message}
          />
        </div>
      </Card>

      <Card title="Included Mixes">
        <div className="space-y-2">
          {mixes.length === 0 ? (
            <p className="text-sm text-gray-500">No mixes available. Create mixes first.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {mixes.map((mix) => (
                <label
                  key={mix.id}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                    includedMixIds.includes(mix.id)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={includedMixIds.includes(mix.id)}
                    onChange={() => toggleMix(mix.id)}
                    className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-900">{mix.name}</span>
                </label>
              ))}
            </div>
          )}
          {errors.includedMixIds?.message && (
            <p className="text-sm text-red-600">{errors.includedMixIds.message}</p>
          )}
        </div>
      </Card>

      <Card title="Pricing">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Weekly Price"
            type="number"
            step="0.01"
            {...register('weeklyPrice', { valueAsNumber: true })}
            error={errors.weeklyPrice?.message}
          />
          
          <Input
            label="Setup Fee"
            type="number"
            step="0.01"
            {...register('setupFee', { valueAsNumber: true })}
            error={errors.setupFee?.message}
          />
          
          <Input
            label="Delivery Fee"
            type="number"
            step="0.01"
            {...register('deliveryFee', { valueAsNumber: true })}
            error={errors.deliveryFee?.message}
          />
        </div>
      </Card>

      <Card title="Duration Discounts (%)">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Input
            label="4 Weeks"
            type="number"
            step="0.1"
            min="0"
            max="100"
            {...register('discount4Weeks', { valueAsNumber: true })}
            error={errors.discount4Weeks?.message}
          />
          
          <Input
            label="8 Weeks"
            type="number"
            step="0.1"
            min="0"
            max="100"
            {...register('discount8Weeks', { valueAsNumber: true })}
            error={errors.discount8Weeks?.message}
          />
          
          <Input
            label="12 Weeks"
            type="number"
            step="0.1"
            min="0"
            max="100"
            {...register('discount12Weeks', { valueAsNumber: true })}
            error={errors.discount12Weeks?.message}
          />
          
          <Input
            label="26 Weeks"
            type="number"
            step="0.1"
            min="0"
            max="100"
            {...register('discount26Weeks', { valueAsNumber: true })}
            error={errors.discount26Weeks?.message}
          />
          
          <Input
            label="52 Weeks"
            type="number"
            step="0.1"
            min="0"
            max="100"
            {...register('discount52Weeks', { valueAsNumber: true })}
            error={errors.discount52Weeks?.message}
          />
        </div>
      </Card>

      <Card title="Plan Options">
        <div className="flex gap-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('allowPause')}
              className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="ml-2 text-sm text-gray-700">Allow Pause</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('allowCustomization')}
              className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="ml-2 text-sm text-gray-700">Allow Customization</span>
          </label>
        </div>
      </Card>

      <div className="flex items-center justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isLoading}>
          {defaultValues ? 'Update' : 'Create'} Plan
        </Button>
      </div>
    </form>
  )
}

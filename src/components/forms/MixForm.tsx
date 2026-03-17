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
import { MixFormData, Microgreen } from '@/types'
import { Plus, Trash2 } from 'lucide-react'

const componentSchema = z.object({
  microgreenId: z.string().min(1, 'Microgreen is required'),
  percentage: z.number().min(0.1, 'Percentage must be greater than 0').max(100, 'Percentage cannot exceed 100'),
  weightGrams: z.number().min(0.1, 'Weight must be greater than 0'),
})

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  totalWeight: z.number().min(0.1, 'Total weight must be greater than 0'),
  servingSize: z.number().min(0.1, 'Serving size must be greater than 0'),
  imageUrl: z.string().optional(),
  components: z.array(componentSchema).min(1, 'At least one component is required'),
})

export interface MixFormProps {
  defaultValues?: Partial<MixFormData>
  microgreens: Microgreen[]
  onSubmit: (data: MixFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  error?: string | null
}

export function MixForm({
  defaultValues,
  microgreens,
  onSubmit,
  onCancel,
  isLoading,
  error,
}: MixFormProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MixFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      totalWeight: 100,
      servingSize: 30,
      components: [{ microgreenId: '', percentage: 100, weightGrams: 100 }],
      ...defaultValues,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'components',
  })

  const watchComponents = watch('components')
  const totalPercentage = watchComponents?.reduce((sum, comp) => sum + (comp?.percentage || 0), 0) || 0

  const handlePercentageChange = (index: number, percentage: number) => {
    const totalWeight = watch('totalWeight') || 100
    const weightGrams = (percentage / 100) * totalWeight
    setValue(`components.${index}.weightGrams`, weightGrams)
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  const microgreenOptions = microgreens.map((m) => ({
    value: m.id,
    label: `${m.name}${m.variety ? ` (${m.variety})` : ''}`,
  }))

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && <ErrorMessage message={error} />}
      
      <Card title="Mix Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Name"
            {...register('name')}
            error={errors.name?.message}
            placeholder="e.g., Superfood Blend"
          />
          
          <Input
            label="Description"
            {...register('description')}
            error={errors.description?.message}
            placeholder="A nutritious blend of microgreens"
          />
          
          <Input
            label="Total Weight (grams)"
            type="number"
            step="0.1"
            {...register('totalWeight', { valueAsNumber: true })}
            error={errors.totalWeight?.message}
          />
          
          <Input
            label="Serving Size (grams)"
            type="number"
            step="0.1"
            {...register('servingSize', { valueAsNumber: true })}
            error={errors.servingSize?.message}
          />
          
          <Input
            label="Image URL"
            {...register('imageUrl')}
            error={errors.imageUrl?.message}
            placeholder="https://example.com/image.jpg"
          />
        </div>
      </Card>

      <Card 
        title="Components" 
        subtitle={`Total percentage: ${totalPercentage.toFixed(1)}%`}
        action={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => append({ microgreenId: '', percentage: 0, weightGrams: 0 })}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        }
      >
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <Select
                  label="Microgreen"
                  options={microgreenOptions}
                  {...register(`components.${index}.microgreenId`)}
                  error={errors.components?.[index]?.microgreenId?.message}
                  placeholder="Select a microgreen"
                />
              </div>
              
              <div className="w-28">
                <Input
                  label="%"
                  type="number"
                  step="0.1"
                  {...register(`components.${index}.percentage`, {
                    valueAsNumber: true,
                    onChange: (e) => handlePercentageChange(index, parseFloat(e.target.value)),
                  })}
                  error={errors.components?.[index]?.percentage?.message}
                />
              </div>
              
              <div className="w-28">
                <Input
                  label="Weight (g)"
                  type="number"
                  step="0.1"
                  disabled
                  {...register(`components.${index}.weightGrams`, { valueAsNumber: true })}
                />
              </div>
              
              <button
                type="button"
                onClick={() => remove(index)}
                className="mt-6 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                disabled={fields.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          
          {errors.components?.message && (
            <p className="text-sm text-red-600">{errors.components.message}</p>
          )}
          
          {totalPercentage !== 100 && (
            <p className={`text-sm ${Math.abs(totalPercentage - 100) < 0.1 ? 'text-green-600' : 'text-yellow-600'}`}>
              {totalPercentage > 100 
                ? `Total percentage exceeds 100% (${totalPercentage.toFixed(1)}%)`
                : `Total percentage is ${totalPercentage.toFixed(1)}% (should be 100%)`
              }
            </p>
          )}
        </div>
      </Card>

      <div className="flex items-center justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isLoading}>
          {defaultValues ? 'Update' : 'Create'} Mix
        </Button>
      </div>
    </form>
  )
}

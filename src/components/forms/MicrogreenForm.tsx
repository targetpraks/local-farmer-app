'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { MicrogreenFormData } from '@/types'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  variety: z.string().optional(),
  description: z.string().optional(),
  growTime: z.number().min(1, 'Grow time must be at least 1 day'),
  yieldPerTray: z.number().min(0.1, 'Yield must be greater than 0'),
  seedingDensity: z.number().min(0.1, 'Seeding density must be greater than 0'),
  defaultSeedCostPerGram: z.number().optional(),
  defaultSoilCostPerTray: z.number().optional(),
  defaultTrayCost: z.number().optional(),
  imageUrl: z.string().optional(),
})

export interface MicrogreenFormProps {
  defaultValues?: Partial<MicrogreenFormData>
  onSubmit: (data: MicrogreenFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  error?: string | null
}

export function MicrogreenForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  error,
}: MicrogreenFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MicrogreenFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      growTime: 10,
      yieldPerTray: 150,
      seedingDensity: 20,
      defaultSeedCostPerGram: 3.00,
      ...defaultValues,
    },
  })

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && <ErrorMessage message={error} />}
      
      <Card title="Basic Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Name"
            {...register('name')}
            error={errors.name?.message}
            placeholder="e.g., Sunflower"
          />
          
          <Input
            label="Variety"
            {...register('variety')}
            error={errors.variety?.message}
            placeholder="e.g., Black Oil"
          />
          
          <div className="md:col-span-2">
            <Input
              label="Description"
              {...register('description')}
              error={errors.description?.message}
              placeholder="Brief description of the microgreen"
            />
          </div>
        </div>
      </Card>

      <Card title="Growing Details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Grow Time (days)"
            type="number"
            {...register('growTime', { valueAsNumber: true })}
            error={errors.growTime?.message}
          />
          
          <Input
            label="Yield Per Tray (grams)"
            type="number"
            step="0.1"
            {...register('yieldPerTray', { valueAsNumber: true })}
            error={errors.yieldPerTray?.message}
          />
          
          <Input
            label="Seeding Density (grams/tray)"
            type="number"
            step="0.1"
            {...register('seedingDensity', { valueAsNumber: true })}
            error={errors.seedingDensity?.message}
          />
        </div>
      </Card>

      <Card title="Default Costs (Optional)">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Seed Cost Per Gram"
            type="number"
            step="0.01"
            {...register('defaultSeedCostPerGram', { valueAsNumber: true })}
            error={errors.defaultSeedCostPerGram?.message}
          />
          
          <Input
            label="Soil Cost Per Tray"
            type="number"
            step="0.01"
            {...register('defaultSoilCostPerTray', { valueAsNumber: true })}
            error={errors.defaultSoilCostPerTray?.message}
          />
          
          <Input
            label="Tray Cost"
            type="number"
            step="0.01"
            {...register('defaultTrayCost', { valueAsNumber: true })}
            error={errors.defaultTrayCost?.message}
          />
        </div>
      </Card>

      <Card title="Image (Optional)">
        <Input
          label="Image URL"
          {...register('imageUrl')}
          error={errors.imageUrl?.message}
          placeholder="https://example.com/image.jpg"
        />
      </Card>

      <div className="flex items-center justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isLoading}>
          {defaultValues ? 'Update' : 'Create'} Microgreen
        </Button>
      </div>
    </form>
  )
}

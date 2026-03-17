import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  totalWeight: z.number().min(0).optional(),
  servingSize: z.number().min(0).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  isTemplate: z.boolean().optional(),
  components: z.array(z.object({
    microgreenId: z.string(),
    percentage: z.number().min(0).max(100),
    weightGrams: z.number().min(0),
  })).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const mix = await prisma.mix.findUnique({
      where: { id: params.id },
      include: {
        components: {
          include: { microgreen: true }
        },
        costings: {
          where: { isDefault: true },
          take: 1
        }
      }
    })

    if (!mix) {
      return NextResponse.json(
        { error: 'Mix not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: mix })
  } catch (error) {
    console.error('Error fetching mix:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mix' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = updateSchema.parse(body)

    const updateData: any = {
      name: validatedData.name,
      description: validatedData.description,
      isActive: validatedData.isActive,
      isTemplate: validatedData.isTemplate,
      imageUrl: validatedData.imageUrl === '' ? null : validatedData.imageUrl,
    }

    if (validatedData.totalWeight !== undefined) {
      updateData.totalWeight = validatedData.totalWeight
    }
    if (validatedData.servingSize !== undefined) {
      updateData.servingSize = validatedData.servingSize
    }

    // Calculate new servings per batch
    if (validatedData.totalWeight !== undefined || validatedData.servingSize !== undefined) {
      const currentMix = await prisma.mix.findUnique({
        where: { id: params.id }
      })
      const totalWeight = validatedData.totalWeight ?? currentMix?.totalWeight ?? 0
      const servingSize = validatedData.servingSize ?? currentMix?.servingSize ?? 1
      updateData.servingsPerBatch = Math.floor(totalWeight / servingSize)
    }

    // Handle component updates
    let includeComponents = {}
    if (validatedData.components) {
      // Delete existing components and create new ones
      await prisma.mixComponent.deleteMany({
        where: { mixId: params.id }
      })
      
      updateData.components = {
        create: validatedData.components.map(c => ({
          microgreenId: c.microgreenId,
          percentage: c.percentage,
          weightGrams: c.weightGrams,
        }))
      }
      
      includeComponents = {
        components: {
          include: { microgreen: true }
        }
      }
    }

    const mix = await prisma.mix.update({
      where: { id: params.id },
      data: updateData,
      include: includeComponents
    })

    return NextResponse.json({ data: mix })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating mix:', error)
    return NextResponse.json(
      { error: 'Failed to update mix' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.mix.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting mix:', error)
    return NextResponse.json(
      { error: 'Failed to delete mix' },
      { status: 500 }
    )
  }
}

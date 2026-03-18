import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  variety: z.string().optional(),
  description: z.string().optional(),
  growTime: z.number().min(1).optional(),
  yieldPerTray: z.number().min(0).optional(),
  seedingDensity: z.number().min(0).optional(),
  defaultSeedCostPerGram: z.number().min(0).optional(),
  defaultSoilCostPerTray: z.number().min(0).optional(),
  defaultTrayCost: z.number().min(0).optional(),
  listPricePerGram: z.number().min(0).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const microgreen = await prisma.microgreen.findUnique({
      where: { id: params.id },
      include: {
        supplierPrices: {
          include: { supplier: true },
          orderBy: { unitPrice: 'asc' }
        },
        costings: {
          where: { isDefault: true },
          take: 1
        },
        mixComponents: {
          include: { mix: true }
        }
      }
    })

    if (!microgreen) {
      return NextResponse.json(
        { error: 'Microgreen not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: microgreen })
  } catch (error) {
    console.error('Error fetching microgreen:', error)
    return NextResponse.json(
      { error: 'Failed to fetch microgreen' },
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

    const microgreen = await prisma.microgreen.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        imageUrl: validatedData.imageUrl === '' ? null : validatedData.imageUrl,
      }
    })

    return NextResponse.json({ data: microgreen })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating microgreen:', error)
    return NextResponse.json(
      { error: 'Failed to update microgreen' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.microgreen.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting microgreen:', error)
    return NextResponse.json(
      { error: 'Failed to delete microgreen' },
      { status: 500 }
    )
  }
}

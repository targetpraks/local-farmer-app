import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const mixCostingSchema = z.object({
  mixId: z.string(),
  ingredientsCost: z.number().min(0),
  packagingCost: z.number().min(0),
  laborCost: z.number().min(0),
  overheadCost: z.number().min(0),
  isDefault: z.boolean().optional(),
  notes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = mixCostingSchema.parse(body)

    const mix = await prisma.mix.findUnique({
      where: { id: validatedData.mixId }
    })

    if (!mix) {
      return NextResponse.json(
        { error: 'Mix not found' },
        { status: 404 }
      )
    }

    // Calculate total cost per batch
    const totalCostPerBatch = 
      validatedData.ingredientsCost +
      validatedData.packagingCost +
      validatedData.laborCost +
      validatedData.overheadCost

    // Calculate cost per serving
    const costPerServing = mix.servingsPerBatch > 0
      ? totalCostPerBatch / mix.servingsPerBatch
      : 0

    // If this is default, unset other defaults for this mix
    if (validatedData.isDefault) {
      await prisma.mixCosting.updateMany({
        where: { mixId: validatedData.mixId },
        data: { isDefault: false }
      })
    }

    const costing = await prisma.mixCosting.create({
      data: {
        mixId: validatedData.mixId,
        ingredientsCost: validatedData.ingredientsCost,
        packagingCost: validatedData.packagingCost,
        laborCost: validatedData.laborCost,
        overheadCost: validatedData.overheadCost,
        totalCostPerBatch,
        costPerServing,
        isDefault: validatedData.isDefault ?? false,
        notes: validatedData.notes,
      },
      include: {
        mix: true
      }
    })

    return NextResponse.json({ data: costing }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating mix costing:', error)
    return NextResponse.json(
      { error: 'Failed to create mix costing' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mixId = searchParams.get('mixId')
    const defaultOnly = searchParams.get('defaultOnly') === 'true'

    const where: any = {}
    
    if (mixId) {
      where.mixId = mixId
    }
    
    if (defaultOnly) {
      where.isDefault = true
    }

    const costings = await prisma.mixCosting.findMany({
      where,
      include: {
        mix: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ data: costings })
  } catch (error) {
    console.error('Error fetching mix costings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mix costings' },
      { status: 500 }
    )
  }
}

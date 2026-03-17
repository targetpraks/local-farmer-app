import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const costingSchema = z.object({
  microgreenId: z.string(),
  seedCost: z.number().min(0),
  soilCost: z.number().min(0),
  trayCost: z.number().min(0),
  laborCost: z.number().min(0),
  waterCost: z.number().min(0),
  electricityCost: z.number().min(0),
  packagingCost: z.number().min(0),
  overheadCost: z.number().min(0),
  isDefault: z.boolean().optional(),
  notes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = costingSchema.parse(body)

    const microgreen = await prisma.microgreen.findUnique({
      where: { id: validatedData.microgreenId }
    })

    if (!microgreen) {
      return NextResponse.json(
        { error: 'Microgreen not found' },
        { status: 404 }
      )
    }

    // Calculate total cost per tray
    const totalCostPerTray = 
      validatedData.seedCost +
      validatedData.soilCost +
      validatedData.trayCost +
      validatedData.laborCost +
      validatedData.waterCost +
      validatedData.electricityCost +
      validatedData.packagingCost +
      validatedData.overheadCost

    // Calculate cost per gram
    const costPerGram = microgreen.yieldPerTray > 0 
      ? totalCostPerTray / microgreen.yieldPerTray 
      : 0

    // Calculate cost per serving (assuming 30g serving)
    const costPerServing = costPerGram * 30

    // If this is default, unset other defaults for this microgreen
    if (validatedData.isDefault) {
      await prisma.microgreenCosting.updateMany({
        where: { microgreenId: validatedData.microgreenId },
        data: { isDefault: false }
      })
    }

    const costing = await prisma.microgreenCosting.create({
      data: {
        microgreenId: validatedData.microgreenId,
        seedCost: validatedData.seedCost,
        soilCost: validatedData.soilCost,
        trayCost: validatedData.trayCost,
        laborCost: validatedData.laborCost,
        waterCost: validatedData.waterCost,
        electricityCost: validatedData.electricityCost,
        packagingCost: validatedData.packagingCost,
        overheadCost: validatedData.overheadCost,
        totalCostPerTray,
        costPerGram,
        costPerServing,
        isDefault: validatedData.isDefault ?? false,
        notes: validatedData.notes,
      },
      include: {
        microgreen: true
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
    console.error('Error creating costing:', error)
    return NextResponse.json(
      { error: 'Failed to create costing' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const microgreenId = searchParams.get('microgreenId')
    const defaultOnly = searchParams.get('defaultOnly') === 'true'

    const where: any = {}
    
    if (microgreenId) {
      where.microgreenId = microgreenId
    }
    
    if (defaultOnly) {
      where.isDefault = true
    }

    const costings = await prisma.microgreenCosting.findMany({
      where,
      include: {
        microgreen: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ data: costings })
  } catch (error) {
    console.error('Error fetching costings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch costings' },
      { status: 500 }
    )
  }
}

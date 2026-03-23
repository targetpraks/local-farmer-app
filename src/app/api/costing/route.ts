import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const costingSchema = z.object({
  microgreenId: z.string(),
  seedCost: z.number().min(0).optional(),
  soilCost: z.number().min(0).optional(),
  trayCost: z.number().min(0).optional(),
  laborCost: z.number().min(0).optional(),
  waterCost: z.number().min(0).optional(),
  electricityCost: z.number().min(0).optional(),
  packagingCost: z.number().min(0).optional(),
  overheadCost: z.number().min(0).optional(),
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

    // Fetch ProductionCostConfig for defaults
    let config = await prisma.productionCostConfig.findFirst()

    // Apply defaults from config (only for fields not provided or set to 0)
    const trayCostPerUse = config && config.trayUses > 0 ? config.trayCost / config.trayUses : 0
    const soilCostPerTray = config ? config.soilCostPerKg * (config.soilPerTrayGrams / 1000) : 0
    const packagingCostDefault = config
      ? config.retailClamShellCost + config.retailInfoLabelCost + config.retailIdLabelCost
      : 0

    const seedCost = (validatedData.seedCost ?? 0) > 0
      ? validatedData.seedCost!
      : trayCostPerUse

    const soilCost = (validatedData.soilCost ?? 0) > 0
      ? validatedData.soilCost!
      : soilCostPerTray

    const trayCost = (validatedData.trayCost ?? 0) > 0
      ? validatedData.trayCost!
      : trayCostPerUse

    const laborCost = (validatedData.laborCost ?? 0) > 0
      ? validatedData.laborCost!
      : (config?.laborCostPerTray ?? 0)

    const waterCost = (validatedData.waterCost ?? 0) > 0
      ? validatedData.waterCost!
      : (config?.waterCostPerTray ?? 0)

    const electricityCost = (validatedData.electricityCost ?? 0) > 0
      ? validatedData.electricityCost!
      : (config?.electricityCostPerTray ?? 0)

    const packagingCost = (validatedData.packagingCost ?? 0) > 0
      ? validatedData.packagingCost!
      : packagingCostDefault

    const overheadCost = validatedData.overheadCost ?? 0

    // Sum mineral costs from config
    let mineralCost = 0
    if (config?.minerals && Array.isArray(config.minerals)) {
      for (const m of config.minerals as any[]) {
        mineralCost += typeof m.costPerTray === 'number' ? m.costPerTray : 0
      }
    }

    // Calculate total cost per tray
    const totalCostPerTray =
      seedCost +
      soilCost +
      trayCost +
      laborCost +
      waterCost +
      electricityCost +
      packagingCost +
      overheadCost +
      mineralCost

    // Bug 7 fix: prevent division by zero — yield must be > 0
    const yieldPerTray = microgreen.yieldPerTray
    if (yieldPerTray <= 0) {
      return NextResponse.json(
        { error: 'Yield per tray must be greater than 0' },
        { status: 400 }
      )
    }

    // Calculate cost per gram
    const costPerGram = totalCostPerTray / yieldPerTray

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
        seedCost,
        soilCost,
        trayCost,
        laborCost,
        waterCost,
        electricityCost,
        packagingCost,
        overheadCost,
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

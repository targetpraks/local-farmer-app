import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const config = await prisma.productionCostConfig.findFirst({
      orderBy: { updatedAt: 'desc' }
    })

    if (!config) {
      return NextResponse.json({ data: getDefaults() })
    }

    return NextResponse.json({ data: config })
  } catch (error) {
    console.error('Error fetching production costs:', error)
    return NextResponse.json({ error: 'Failed to fetch production costs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const config = await prisma.productionCostConfig.create({ data: buildData(body) })
    return NextResponse.json({ data: config }, { status: 201 })
  } catch (error) {
    console.error('Error creating production costs:', error)
    return NextResponse.json({ error: 'Failed to create production costs' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    let config = await prisma.productionCostConfig.findFirst({ orderBy: { updatedAt: 'desc' } })

    if (!config) {
      config = await prisma.productionCostConfig.create({ data: buildData(body) })
    } else {
      config = await prisma.productionCostConfig.update({
        where: { id: config.id },
        data: buildData(body),
      })
    }

    return NextResponse.json({ data: config })
  } catch (error) {
    console.error('Error updating production costs:', error)
    return NextResponse.json({ error: 'Failed to update production costs' }, { status: 500 })
  }
}

function getDefaults() {
  return {
    trayCost: 50, trayUses: 1000, trayLengthCm: 42, trayWidthCm: 22, trayDepthCm: 2,
    fabricPaperCost: 2, soilCostPerKg: 15, soilPerTrayGrams: 500,
    waterCostPerTray: 1, electricityCostPerTray: 2, laborCostPerTray: 5,
    markupPercent: 100,
    retailClamShellCost: 3, retailInfoLabelCost: 0.5, retailIdLabelCost: 0.5,
    wholesalePackagingSmall: 1.5, wholesalePackagingMedium: 2, wholesalePackagingLarge: 3,
    wholesaleIdLabelCost: 0.5,
    minerals: [],
  }
}

function buildData(body: any) {
  return {
    trayCost: body.trayCost ?? 50,
    trayUses: body.trayUses ?? 1000,
    trayLengthCm: body.trayLengthCm ?? 42,
    trayWidthCm: body.trayWidthCm ?? 22,
    trayDepthCm: body.trayDepthCm ?? 2,
    fabricPaperCost: body.fabricPaperCost ?? 2,
    soilCostPerKg: body.soilCostPerKg ?? 15,
    soilPerTrayGrams: body.soilPerTrayGrams ?? 500,
    waterCostPerTray: body.waterCostPerTray ?? 1,
    electricityCostPerTray: body.electricityCostPerTray ?? 2,
    laborCostPerTray: body.laborCostPerTray ?? 5,
    markupPercent: body.markupPercent ?? 100,
    retailClamShellCost: body.retailClamShellCost ?? 3,
    retailInfoLabelCost: body.retailInfoLabelCost ?? 0.5,
    retailIdLabelCost: body.retailIdLabelCost ?? 0.5,
    wholesalePackagingSmall: body.wholesalePackagingSmall ?? 1.5,
    wholesalePackagingMedium: body.wholesalePackagingMedium ?? 2,
    wholesalePackagingLarge: body.wholesalePackagingLarge ?? 3,
    wholesaleIdLabelCost: body.wholesaleIdLabelCost ?? 0.5,
    minerals: body.minerals ?? [],
  }
}

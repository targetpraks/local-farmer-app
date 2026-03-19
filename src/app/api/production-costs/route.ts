import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const config = await prisma.productionCostConfig.findFirst({
      orderBy: { updatedAt: 'desc' }
    })
    
    // Return default if no config exists
    if (!config) {
      return NextResponse.json({
        data: {
          trayCost: 50,
          trayUses: 1000,
          trayLengthCm: 42,
          trayWidthCm: 22,
          trayDepthCm: 2,
          fabricPaperCost: 2,
          soilCostPerKg: 15,
          soilPerTrayGrams: 500,
          waterCostPerTray: 1,
          electricityCostPerTray: 2,
          laborCostPerTray: 5,
          markupPercent: 100,
          // Retail Packaging
          retailClamShellCost: 3,
          retailInfoLabelCost: 0.5,
          retailIdLabelCost: 0.5,
          // Wholesale Packaging
          wholesalePackagingSmall: 1.5,
          wholesalePackagingMedium: 2,
          wholesalePackagingLarge: 3,
          wholesaleIdLabelCost: 0.5,
        }
      })
    }
    
    return NextResponse.json({ data: config })
  } catch (error) {
    console.error('Error fetching production costs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch production costs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const config = await prisma.productionCostConfig.create({
      data: {
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
        // Retail Packaging
        retailClamShellCost: body.retailClamShellCost ?? 3,
        retailInfoLabelCost: body.retailInfoLabelCost ?? 0.5,
        retailIdLabelCost: body.retailIdLabelCost ?? 0.5,
        // Wholesale Packaging
        wholesalePackagingSmall: body.wholesalePackagingSmall ?? 1.5,
        wholesalePackagingMedium: body.wholesalePackagingMedium ?? 2,
        wholesalePackagingLarge: body.wholesalePackagingLarge ?? 3,
        wholesaleIdLabelCost: body.wholesaleIdLabelCost ?? 0.5,
      }
    })
    
    return NextResponse.json({ data: config }, { status: 201 })
  } catch (error) {
    console.error('Error creating production costs:', error)
    return NextResponse.json(
      { error: 'Failed to create production costs' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Find existing config or create new one
    let config = await prisma.productionCostConfig.findFirst({
      orderBy: { updatedAt: 'desc' }
    })
    
    if (!config) {
      // Create new config
      config = await prisma.productionCostConfig.create({
        data: {
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
          // Retail Packaging
          retailClamShellCost: body.retailClamShellCost ?? 3,
          retailInfoLabelCost: body.retailInfoLabelCost ?? 0.5,
          retailIdLabelCost: body.retailIdLabelCost ?? 0.5,
          // Wholesale Packaging
          wholesalePackagingSmall: body.wholesalePackagingSmall ?? 1.5,
          wholesalePackagingMedium: body.wholesalePackagingMedium ?? 2,
          wholesalePackagingLarge: body.wholesalePackagingLarge ?? 3,
          wholesaleIdLabelCost: body.wholesaleIdLabelCost ?? 0.5,
        }
      })
    } else {
      // Update existing
      config = await prisma.productionCostConfig.update({
        where: { id: config.id },
        data: {
          trayCost: body.trayCost,
          trayUses: body.trayUses,
          trayLengthCm: body.trayLengthCm,
          trayWidthCm: body.trayWidthCm,
          trayDepthCm: body.trayDepthCm,
          fabricPaperCost: body.fabricPaperCost,
          soilCostPerKg: body.soilCostPerKg,
          soilPerTrayGrams: body.soilPerTrayGrams,
          waterCostPerTray: body.waterCostPerTray,
          electricityCostPerTray: body.electricityCostPerTray,
          laborCostPerTray: body.laborCostPerTray,
          markupPercent: body.markupPercent,
          // Retail Packaging
          retailClamShellCost: body.retailClamShellCost,
          retailInfoLabelCost: body.retailInfoLabelCost,
          retailIdLabelCost: body.retailIdLabelCost,
          // Wholesale Packaging
          wholesalePackagingSmall: body.wholesalePackagingSmall,
          wholesalePackagingMedium: body.wholesalePackagingMedium,
          wholesalePackagingLarge: body.wholesalePackagingLarge,
          wholesaleIdLabelCost: body.wholesaleIdLabelCost,
        }
      })
    }
    
    return NextResponse.json({ data: config })
  } catch (error) {
    console.error('Error updating production costs:', error)
    return NextResponse.json(
      { error: 'Failed to update production costs' },
      { status: 500 }
    )
  }
}

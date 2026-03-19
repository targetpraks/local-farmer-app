import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Delete all existing production cost configs
    await prisma.productionCostConfig.deleteMany()

    // Create a new default config
    const defaultConfig = await prisma.productionCostConfig.create({
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

    return NextResponse.json({
      success: true,
      data: defaultConfig,
      message: 'Production configuration reset to defaults'
    })
  } catch (error) {
    console.error('Failed to reset production config:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reset production config' },
      { status: 500 }
    )
  }
}

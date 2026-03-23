import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Delete in order to respect FK constraints
    await prisma.$transaction([
      prisma.mixComponent.deleteMany(),
      prisma.mix.deleteMany(),
      prisma.microgreen.deleteMany(),
      prisma.productionCostConfig.deleteMany(),
      prisma.customerTier.deleteMany(),
      prisma.subscriptionPlan.deleteMany(),
    ])

    return NextResponse.json({
      success: true,
      message: 'All data reset (microgreens, mixes, configs, tiers, plans)'
    })
  } catch (error) {
    console.error('Failed to reset all data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reset all data' },
      { status: 500 }
    )
  }
}

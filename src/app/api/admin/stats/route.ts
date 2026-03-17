import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const stats = await Promise.all([
      prisma.microgreen.count(),
      prisma.mix.count(),
      prisma.supplier.count(),
      prisma.customerTier.count(),
      prisma.subscriptionPlan.count(),
      prisma.user.count(),
    ])

    return NextResponse.json({
      data: {
        microgreens: stats[0],
        mixes: stats[1],
        suppliers: stats[2],
        customerTiers: stats[3],
        subscriptionPlans: stats[4],
        users: stats[5],
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}

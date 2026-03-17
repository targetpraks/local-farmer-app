import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const tierSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  markupType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FIXED_PRICE']),
  markupValue: z.number().min(0),
  minimumMargin: z.number().min(0).optional(),
  volumeDiscountThreshold: z.number().min(0).optional(),
  volumeDiscountPercent: z.number().min(0).max(100).optional(),
  priority: z.number().int().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')

    const where: any = {}
    
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const tiers = await prisma.customerTier.findMany({
      where,
      include: {
        _count: {
          select: { prices: true, subscriptionPlans: true }
        }
      },
      orderBy: { priority: 'desc' }
    })

    return NextResponse.json({ data: tiers })
  } catch (error) {
    console.error('Error fetching customer tiers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer tiers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = tierSchema.parse(body)

    const tier = await prisma.customerTier.create({
      data: validatedData
    })

    return NextResponse.json({ data: tier }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating customer tier:', error)
    return NextResponse.json(
      { error: 'Failed to create customer tier' },
      { status: 500 }
    )
  }
}

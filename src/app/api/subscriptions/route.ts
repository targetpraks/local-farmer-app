import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSubscriptionSKU } from '@/lib/sku-generator'
import { z } from 'zod'

const subscriptionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  tierId: z.string(),
  minDurationWeeks: z.number().min(1),
  maxDurationWeeks: z.number().min(1).optional(),
  weeklyServings: z.number().min(1),
  servingSizeGrams: z.number().min(0),
  includedMixIds: z.array(z.string()).default([]),
  weeklyPrice: z.number().min(0),
  setupFee: z.number().min(0).optional(),
  deliveryFee: z.number().min(0).optional(),
  discount4Weeks: z.number().min(0).max(100).optional(),
  discount8Weeks: z.number().min(0).max(100).optional(),
  discount12Weeks: z.number().min(0).max(100).optional(),
  discount26Weeks: z.number().min(0).max(100).optional(),
  discount52Weeks: z.number().min(0).max(100).optional(),
  allowPause: z.boolean().optional(),
  allowCustomization: z.boolean().optional(),
})

// Calculate total price with discount
function calculateTotalPrice(weeklyPrice: number, weeks: number, discountPercent: number = 0): number {
  const subtotal = weeklyPrice * weeks
  const discount = subtotal * (discountPercent / 100)
  return subtotal - discount
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tierId = searchParams.get('tierId')
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    
    if (tierId) {
      where.tierId = tierId
    }
    
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscriptionPlan.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { weeklyPrice: 'asc' },
        include: {
          tier: true
        }
      }),
      prisma.subscriptionPlan.count({ where })
    ])

    return NextResponse.json({
      data: subscriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching subscription plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = subscriptionSchema.parse(body)

    // Calculate totals
    const total4Weeks = calculateTotalPrice(validatedData.weeklyPrice, 4, validatedData.discount4Weeks)
    const total8Weeks = calculateTotalPrice(validatedData.weeklyPrice, 8, validatedData.discount8Weeks)
    const total12Weeks = calculateTotalPrice(validatedData.weeklyPrice, 12, validatedData.discount12Weeks)
    const total26Weeks = calculateTotalPrice(validatedData.weeklyPrice, 26, validatedData.discount26Weeks)
    const total52Weeks = calculateTotalPrice(validatedData.weeklyPrice, 52, validatedData.discount52Weeks)

    const sku = await generateSubscriptionSKU()

    const subscription = await prisma.subscriptionPlan.create({
      data: {
        sku,
        name: validatedData.name,
        description: validatedData.description,
        tierId: validatedData.tierId,
        minDurationWeeks: validatedData.minDurationWeeks,
        maxDurationWeeks: validatedData.maxDurationWeeks,
        weeklyServings: validatedData.weeklyServings,
        servingSizeGrams: validatedData.servingSizeGrams,
        includedMixIds: validatedData.includedMixIds,
        weeklyPrice: validatedData.weeklyPrice,
        setupFee: validatedData.setupFee,
        deliveryFee: validatedData.deliveryFee,
        discount4Weeks: validatedData.discount4Weeks ?? 0,
        discount8Weeks: validatedData.discount8Weeks ?? 0,
        discount12Weeks: validatedData.discount12Weeks ?? 0,
        discount26Weeks: validatedData.discount26Weeks ?? 0,
        discount52Weeks: validatedData.discount52Weeks ?? 0,
        total4Weeks,
        total8Weeks,
        total12Weeks,
        total26Weeks,
        total52Weeks,
        allowPause: validatedData.allowPause ?? true,
        allowCustomization: validatedData.allowCustomization ?? false,
      },
      include: {
        tier: true
      }
    })

    return NextResponse.json({ data: subscription }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating subscription plan:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription plan' },
      { status: 500 }
    )
  }
}

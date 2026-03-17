import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  tierId: z.string().optional(),
  minDurationWeeks: z.number().min(1).optional(),
  maxDurationWeeks: z.number().min(1).optional(),
  weeklyServings: z.number().min(1).optional(),
  servingSizeGrams: z.number().min(0).optional(),
  includedMixIds: z.array(z.string()).optional(),
  weeklyPrice: z.number().min(0).optional(),
  setupFee: z.number().min(0).optional(),
  deliveryFee: z.number().min(0).optional(),
  discount4Weeks: z.number().min(0).max(100).optional(),
  discount8Weeks: z.number().min(0).max(100).optional(),
  discount12Weeks: z.number().min(0).max(100).optional(),
  discount26Weeks: z.number().min(0).max(100).optional(),
  discount52Weeks: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
  allowPause: z.boolean().optional(),
  allowCustomization: z.boolean().optional(),
})

// Calculate total price with discount
function calculateTotalPrice(weeklyPrice: number, weeks: number, discountPercent: number = 0): number {
  const subtotal = weeklyPrice * weeks
  const discount = subtotal * (discountPercent / 100)
  return subtotal - discount
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subscription = await prisma.subscriptionPlan.findUnique({
      where: { id: params.id },
      include: {
        tier: true
      }
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: subscription })
  } catch (error) {
    console.error('Error fetching subscription plan:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription plan' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = updateSchema.parse(body)

    const current = await prisma.subscriptionPlan.findUnique({
      where: { id: params.id }
    })

    if (!current) {
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      )
    }

    const weeklyPrice = validatedData.weeklyPrice ?? current.weeklyPrice
    const updateData: any = { ...validatedData }

    // Recalculate totals if price or discounts changed
    if (validatedData.weeklyPrice !== undefined || 
        validatedData.discount4Weeks !== undefined ||
        validatedData.discount8Weeks !== undefined ||
        validatedData.discount12Weeks !== undefined ||
        validatedData.discount26Weeks !== undefined ||
        validatedData.discount52Weeks !== undefined) {
      
      updateData.total4Weeks = calculateTotalPrice(
        weeklyPrice, 
        4, 
        validatedData.discount4Weeks ?? current.discount4Weeks
      )
      updateData.total8Weeks = calculateTotalPrice(
        weeklyPrice, 
        8, 
        validatedData.discount8Weeks ?? current.discount8Weeks
      )
      updateData.total12Weeks = calculateTotalPrice(
        weeklyPrice, 
        12, 
        validatedData.discount12Weeks ?? current.discount12Weeks
      )
      updateData.total26Weeks = calculateTotalPrice(
        weeklyPrice, 
        26, 
        validatedData.discount26Weeks ?? current.discount26Weeks
      )
      updateData.total52Weeks = calculateTotalPrice(
        weeklyPrice, 
        52, 
        validatedData.discount52Weeks ?? current.discount52Weeks
      )
    }

    const subscription = await prisma.subscriptionPlan.update({
      where: { id: params.id },
      data: updateData,
      include: {
        tier: true
      }
    })

    return NextResponse.json({ data: subscription })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating subscription plan:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription plan' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.subscriptionPlan.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting subscription plan:', error)
    return NextResponse.json(
      { error: 'Failed to delete subscription plan' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const calculateSchema = z.object({
  microgreenId: z.string().optional(),
  mixId: z.string().optional(),
  tierId: z.string(),
  baseCost: z.number().min(0),
  quantity: z.number().min(1).default(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = calculateSchema.parse(body)

    const tier = await prisma.customerTier.findUnique({
      where: { id: validatedData.tierId }
    })

    if (!tier) {
      return NextResponse.json(
        { error: 'Customer tier not found' },
        { status: 404 }
      )
    }

    let baseCost = validatedData.baseCost
    let markupPercent = 0
    let markupAmount = 0
    let finalPrice = 0
    let margin = 0
    let marginPercent = 0

    // Check for volume discount
    const hasVolumeDiscount = tier.volumeDiscountThreshold && tier.volumeDiscountPercent
      && validatedData.quantity >= tier.volumeDiscountThreshold

    const discountMultiplier = hasVolumeDiscount && tier.volumeDiscountPercent
      ? (1 - tier.volumeDiscountPercent / 100) 
      : 1

    switch (tier.markupType) {
      case 'PERCENTAGE':
        markupPercent = tier.markupValue
        markupAmount = baseCost * (markupPercent / 100)
        finalPrice = (baseCost + markupAmount) * discountMultiplier
        break
      
      case 'FIXED_AMOUNT':
        markupAmount = tier.markupValue
        finalPrice = (baseCost + markupAmount) * discountMultiplier
        markupPercent = baseCost > 0 ? (markupAmount / baseCost) * 100 : 0
        break
      
      case 'FIXED_PRICE':
        finalPrice = tier.markupValue * discountMultiplier
        markupAmount = finalPrice - baseCost
        markupPercent = baseCost > 0 ? (markupAmount / baseCost) * 100 : 0
        break
    }

    margin = finalPrice - baseCost
    marginPercent = finalPrice > 0 ? (margin / finalPrice) * 100 : 0

    // Check minimum margin
    if (tier.minimumMargin && margin < tier.minimumMargin) {
      finalPrice = baseCost + tier.minimumMargin
      margin = tier.minimumMargin
      markupAmount = tier.minimumMargin
      marginPercent = finalPrice > 0 ? (margin / finalPrice) * 100 : 0
    }

    return NextResponse.json({
      data: {
        baseCost,
        markupPercent,
        markupAmount,
        finalPrice,
        margin,
        marginPercent,
        volumeDiscountApplied: hasVolumeDiscount,
        discountPercent: hasVolumeDiscount ? tier.volumeDiscountPercent : 0,
        quantity: validatedData.quantity,
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error calculating pricing:', error)
    return NextResponse.json(
      { error: 'Failed to calculate pricing' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const querySchema = z.object({
  tierId: z.string(),
  microgreenId: z.string().optional(),
  mixId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tierId = searchParams.get('tierId')
    const microgreenId = searchParams.get('microgreenId')
    const mixId = searchParams.get('mixId')

    if (!tierId || (!microgreenId && !mixId)) {
      return NextResponse.json(
        { error: 'tierId and at least one of microgreenId or mixId are required' },
        { status: 400 }
      )
    }

    // Fetch the tier
    const tier = await prisma.customerTier.findUnique({ where: { id: tierId } })
    if (!tier || !tier.isActive) {
      return NextResponse.json({ error: 'Customer tier not found or inactive' }, { status: 404 })
    }

    let baseCost = 0
    let isOverridden = false
    let customPrice: number | null = null

    if (microgreenId) {
      // 1. Look for a CustomerTierPrice override
      const tierPrice = await prisma.customerTierPrice.findFirst({
        where: {
          tierId,
          microgreenId,
          isActive: true,
        }
      })

      if (tierPrice?.isOverridden && tierPrice.customPrice !== null) {
        baseCost = tierPrice.baseCost
        isOverridden = true
        customPrice = tierPrice.customPrice
      } else {
        // 2. Fetch the default MicrogreenCosting
        const costing = await prisma.microgreenCosting.findFirst({
          where: { microgreenId, isDefault: true },
          include: { microgreen: true }
        })

        if (!costing) {
          return NextResponse.json({ error: 'No costing found for this microgreen' }, { status: 404 })
        }

        baseCost = costing.costPerGram ?? 0
      }
    } else if (mixId) {
      // 1. Look for a CustomerTierPrice override
      const tierPrice = await prisma.customerTierPrice.findFirst({
        where: {
          tierId,
          mixId,
          isActive: true,
        }
      })

      if (tierPrice?.isOverridden && tierPrice.customPrice !== null) {
        baseCost = tierPrice.baseCost
        isOverridden = true
        customPrice = tierPrice.customPrice
      } else {
        // 2. Fetch the default MixCosting
        const costing = await prisma.mixCosting.findFirst({
          where: { mixId, isDefault: true },
          include: { mix: true }
        })

        if (!costing) {
          return NextResponse.json({ error: 'No costing found for this mix' }, { status: 404 })
        }

        // MixCosting uses costPerServing instead of costPerGram
        // Calculate per gram if possible
        const mix = costing.mix
        if (mix.servingSize > 0 && costing.costPerServing) {
          baseCost = costing.costPerServing / mix.servingSize
        } else if (costing.totalCostPerBatch && mix.totalWeight > 0) {
          baseCost = costing.totalCostPerBatch / mix.totalWeight
        } else {
          baseCost = costing.costPerServing ?? 0
        }
      }
    }

    // 4. Apply tier's markupType + markupValue
    let markupPercent = 0
    let finalPrice = customPrice ?? baseCost

    if (!isOverridden) {
      if (tier.markupType === 'PERCENTAGE') {
        markupPercent = tier.markupValue
        finalPrice = baseCost * (1 + tier.markupValue / 100)
      } else {
        // FIXED — applies a fixed dollar amount per gram
        markupPercent = baseCost > 0 ? tier.markupValue / baseCost * 100 : 0
        finalPrice = baseCost + tier.markupValue
      }

      // 5. Enforce minimumMargin if set
      if (tier.minimumMargin !== null && tier.minimumMargin > 0) {
        if (finalPrice - baseCost < tier.minimumMargin) {
          finalPrice = baseCost + tier.minimumMargin
        }
      }
    }

    return NextResponse.json({
      data: {
        baseCost: Math.round(baseCost * 10000) / 10000,
        markupPercent: Math.round(markupPercent * 100) / 100,
        finalPrice: Math.round(finalPrice * 10000) / 10000,
        isOverridden,
        customPrice: customPrice !== null ? Math.round(customPrice * 10000) / 10000 : null,
      }
    })
  } catch (error) {
    console.error('Error in pricing lookup:', error)
    return NextResponse.json(
      { error: 'Failed to lookup pricing' },
      { status: 500 }
    )
  }
}

// POST /api/pricing — batch pricing lookup
const batchQuerySchema = z.object({
  tierId: z.string(),
  microgreenIds: z.array(z.string()).optional(),
  mixIds: z.array(z.string()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tierId, microgreenIds, mixIds } = batchQuerySchema.parse(body)

    // Fetch tier once
    const tier = await prisma.customerTier.findUnique({ where: { id: tierId } })
    if (!tier || !tier.isActive) {
      return NextResponse.json({ error: 'Customer tier not found or inactive' }, { status: 404 })
    }

    const results: Record<string, {
      baseCost: number
      markupPercent: number
      finalPrice: number
      isOverridden: boolean
      customPrice: number | null
    }> = {}

    // Process microgreens
    if (microgreenIds && microgreenIds.length > 0) {
      const costings = await prisma.microgreenCosting.findMany({
        where: { microgreenId: { in: microgreenIds }, isDefault: true },
        include: { microgreen: true }
      })
      const costingMap = new Map(costings.map(c => [c.microgreenId, c]))
      const tierPrices = await prisma.customerTierPrice.findMany({
        where: { tierId, microgreenId: { in: microgreenIds }, isActive: true }
      })
      const tierPriceMap = new Map(tierPrices.map(tp => [tp.microgreenId!, tp]))

      for (const microgreenId of microgreenIds) {
        const tierPrice = tierPriceMap.get(microgreenId)
        const costing = costingMap.get(microgreenId)

        let baseCost = 0
        let isOverridden = false
        let customPrice: number | null = null

        if (tierPrice?.isOverridden && tierPrice.customPrice !== null) {
          baseCost = tierPrice.baseCost
          isOverridden = true
          customPrice = tierPrice.customPrice
        } else if (costing) {
          // MicrogreenCosting has costPerGram directly
          baseCost = costing.costPerGram ?? 0
        }

        let markupPercent = 0
        let finalPrice = customPrice ?? baseCost

        if (!isOverridden) {
          if (tier.markupType === 'PERCENTAGE') {
            markupPercent = tier.markupValue
            finalPrice = baseCost * (1 + tier.markupValue / 100)
          } else {
            markupPercent = baseCost > 0 ? tier.markupValue / baseCost * 100 : 0
            finalPrice = baseCost + tier.markupValue
          }

          if (tier.minimumMargin !== null && tier.minimumMargin > 0) {
            if (finalPrice - baseCost < tier.minimumMargin) {
              finalPrice = baseCost + tier.minimumMargin
            }
          }
        }

        results[microgreenId] = {
          baseCost: Math.round(baseCost * 10000) / 10000,
          markupPercent: Math.round(markupPercent * 100) / 100,
          finalPrice: Math.round(finalPrice * 10000) / 10000,
          isOverridden,
          customPrice: customPrice !== null ? Math.round(customPrice * 10000) / 10000 : null,
        }
      }
    }

    // Process mixes
    if (mixIds && mixIds.length > 0) {
      const costings = await prisma.mixCosting.findMany({
        where: { mixId: { in: mixIds }, isDefault: true },
        include: { mix: true }
      })
      const costingMap = new Map(costings.map(c => [c.mixId, c]))
      const tierPrices = await prisma.customerTierPrice.findMany({
        where: { tierId, mixId: { in: mixIds }, isActive: true }
      })
      const tierPriceMap = new Map(tierPrices.map(tp => [tp.mixId!, tp]))

      for (const mixId of mixIds) {
        const tierPrice = tierPriceMap.get(mixId)
        const costing = costingMap.get(mixId)

        let baseCost = 0
        let isOverridden = false
        let customPrice: number | null = null

        if (tierPrice?.isOverridden && tierPrice.customPrice !== null) {
          baseCost = tierPrice.baseCost
          isOverridden = true
          customPrice = tierPrice.customPrice
        } else if (costing) {
          // MixCosting uses costPerServing instead of costPerGram
          const mix = costing.mix
          if (mix.servingSize > 0 && costing.costPerServing) {
            baseCost = costing.costPerServing / mix.servingSize
          } else if (costing.totalCostPerBatch && mix.totalWeight > 0) {
            baseCost = costing.totalCostPerBatch / mix.totalWeight
          } else {
            baseCost = costing.costPerServing ?? 0
          }
        }

        let markupPercent = 0
        let finalPrice = customPrice ?? baseCost

        if (!isOverridden) {
          if (tier.markupType === 'PERCENTAGE') {
            markupPercent = tier.markupValue
            finalPrice = baseCost * (1 + tier.markupValue / 100)
          } else {
            markupPercent = baseCost > 0 ? tier.markupValue / baseCost * 100 : 0
            finalPrice = baseCost + tier.markupValue
          }

          if (tier.minimumMargin !== null && tier.minimumMargin > 0) {
            if (finalPrice - baseCost < tier.minimumMargin) {
              finalPrice = baseCost + tier.minimumMargin
            }
          }
        }

        results[mixId] = {
          baseCost: Math.round(baseCost * 10000) / 10000,
          markupPercent: Math.round(markupPercent * 100) / 100,
          finalPrice: Math.round(finalPrice * 10000) / 10000,
          isOverridden,
          customPrice: customPrice !== null ? Math.round(customPrice * 10000) / 10000 : null,
        }
      }
    }

    return NextResponse.json({ data: results })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error in batch pricing lookup:', error)
    return NextResponse.json({ error: 'Failed to lookup pricing' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcBatchCosting, calcPrice } from '@/lib/mushrooms/magicMix'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { batchId, labourHours, labourRate, overheadPct } = body

  const batch = await prisma.mushroomBatch.findUnique({
    where: { id: batchId },
    include: { variety: true, harvests: true },
  })
  if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 })

  const totalKgHarvested = batch.harvests.reduce((s, h) => s + h.kgHarvested, 0)
  const costing = calcBatchCosting({
    bagCount: batch.bagCount,
    labourHours: labourHours ?? 0,
    labourRate: labourRate ?? 45,
    overheadPct: overheadPct ?? 5,
    totalKgHarvested,
  })

  // Upsert costing
  await prisma.mushroomCosting.upsert({
    where: { batchId },
    update: costing,
    create: { batchId, ...costing },
  })

  const { wholesale, retail } = calcPrice(costing.costPerKg, batch.variety.targetMarginPct)

  // Upsert price record
  await prisma.mushroomPriceRecord.upsert({
    where: { batchId },
    update: {
      costPerKg: costing.costPerKg,
      targetMarginPct: batch.variety.targetMarginPct,
      suggestedWholesale: wholesale,
      suggestedRetail: retail,
    },
    create: {
      batchId,
      varietyId: batch.varietyId,
      costPerKg: costing.costPerKg,
      targetMarginPct: batch.variety.targetMarginPct,
      suggestedWholesale: wholesale,
      suggestedRetail: retail,
    },
  })

  return NextResponse.json({ costing, pricing: { wholesale, retail } })
}

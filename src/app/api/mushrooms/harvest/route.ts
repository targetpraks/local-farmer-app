import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { batchId, flushNumber, kgHarvested } = body

  if (!batchId || !flushNumber || !kgHarvested) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Get batch + variety
  const batch = await prisma.mushroomBatch.findUnique({
    where: { id: batchId },
    include: { variety: true },
  })
  if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 })

  // Upsert harvest
  const harvest = await prisma.mushroomHarvest.upsert({
    where: { batchId_flushNumber: { batchId, flushNumber } },
    update: { kgHarvested },
    create: {
      batchId,
      varietyId: batch.varietyId,
      flushNumber,
      kgHarvested,
    },
  })

  // Check if both flushes logged → auto-complete batch
  const allHarvests = await prisma.mushroomHarvest.findMany({ where: { batchId } })
  if (allHarvests.length === 2) {
    await prisma.mushroomBatch.update({
      where: { id: batchId },
      data: { status: 'COMPLETED' },
    })
  }

  return NextResponse.json({ harvest, allHarvests }, { status: 201 })
}

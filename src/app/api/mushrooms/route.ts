import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Get next batch code: MUSH-YYYY-NNN
async function nextBatchCode(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `MUSH-${year}-`
  const last = await prisma.mushroomBatch.findFirst({
    where: { batchCode: { startsWith: prefix } },
    orderBy: { batchCode: 'desc' },
    select: { batchCode: true },
  })
  const seq = last
    ? parseInt(last.batchCode.replace(prefix, '')) + 1
    : 1
  return `${prefix}${String(seq).padStart(3, '0')}`
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const batches = await prisma.mushroomBatch.findMany({
    where: status ? { status: status as 'ACTIVE' | 'COMPLETED' } : undefined,
    include: { variety: true, harvests: true, costings: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json(batches)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { varietyId, bagCount, inoculationDate, notes } = body

  if (!varietyId || !bagCount || !inoculationDate) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const substrateKg = bagCount * 2
  const substrateCost = substrateKg * 16.95 // MAGIC_MIX_COST_PER_KG
  const batchCode = await nextBatchCode()

  const batch = await prisma.mushroomBatch.create({
    data: {
      batchCode,
      varietyId,
      inoculationDate: new Date(inoculationDate),
      bagCount,
      substrateKg,
      substrateCost,
      notes,
    },
  })

  return NextResponse.json({ batch }, { status: 201 })
}

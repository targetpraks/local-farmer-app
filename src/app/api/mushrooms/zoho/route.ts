import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { pushPriceToZoho, pushStockToZoho, testZoho } from '@/lib/mushrooms/zoho'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { batchId, action } = body // action: 'price' | 'stock' | 'test'

  if (action === 'test') {
    const result = await testZoho()
    return NextResponse.json(result)
  }

  const batch = await prisma.mushroomBatch.findUnique({
    where: { id: batchId },
    include: { variety: true, priceRecords: true, harvests: true },
  })
  if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 })

  const variety = batch.variety
  if (!variety.zohoInventoryItemId) {
    return NextResponse.json({ error: 'No Zoho Item ID set for this variety' }, { status: 400 })
  }

  try {
    if (action === 'price') {
      const pr = batch.priceRecords[0]
      if (!pr) return NextResponse.json({ error: 'No price record found' }, { status: 400 })
      await pushPriceToZoho(variety.zohoInventoryItemId, pr.suggestedWholesale, pr.suggestedRetail)
      await prisma.mushroomPriceRecord.update({
        where: { id: pr.id },
        data: { zohoPricePushed: true, zohoPushedAt: new Date() },
      })
      return NextResponse.json({ success: true, action: 'price' })
    }

    if (action === 'stock') {
      const totalKg = batch.harvests.reduce((s, h) => s + h.kgHarvested, 0)
      const result = await pushStockToZoho(variety.zohoInventoryItemId, totalKg)
      await prisma.mushroomHarvest.updateMany({
        where: { batchId, zohoPushed: false },
        data: { zohoPushed: true },
      })
      return NextResponse.json({ success: true, action: 'stock', zohoResult: result })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

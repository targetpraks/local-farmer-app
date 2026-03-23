import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const batch = await prisma.mushroomBatch.findUnique({
    where: { id: params.id },
    include: { variety: true, harvests: true, costings: true, priceRecords: true },
  })
  if (!batch) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(batch)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { status, notes } = body
  const update: Record<string, unknown> = {}
  if (status) update.status = status
  if (notes !== undefined) update.notes = notes
  const batch = await prisma.mushroomBatch.update({ where: { id: params.id }, data: update })
  return NextResponse.json(batch)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.mushroomBatch.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}

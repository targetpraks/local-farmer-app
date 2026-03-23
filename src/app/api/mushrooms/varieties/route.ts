import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const varieties = await prisma.mushroomVariety.findMany({
      where: { isActive: true },
      orderBy: { displayName: 'asc' },
    })
    return NextResponse.json({ data: varieties })
  } catch (error) {
    console.error('Error fetching mushroom varieties:', error)
    return NextResponse.json({ error: 'Failed to fetch varieties' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { displayName, slug, colour, targetMarginPct } = body

    if (!displayName || !slug) {
      return NextResponse.json({ error: 'displayName and slug are required' }, { status: 400 })
    }

    const variety = await prisma.mushroomVariety.create({
      data: {
        displayName,
        slug,
        colour: colour || '#888888',
        targetMarginPct: targetMarginPct ?? 35,
        isActive: true,
      },
    })

    return NextResponse.json({ variety }, { status: 201 })
  } catch (error) {
    console.error('Error creating mushroom variety:', error)
    return NextResponse.json({ error: 'Failed to create variety' }, { status: 500 })
  }
}

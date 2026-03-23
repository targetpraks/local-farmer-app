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

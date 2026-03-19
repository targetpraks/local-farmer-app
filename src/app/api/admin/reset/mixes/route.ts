import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    await prisma.mix.deleteMany()
    return NextResponse.json({
      success: true,
      message: 'All mixes deleted'
    })
  } catch (error) {
    console.error('Failed to reset mixes:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reset mixes' },
      { status: 500 }
    )
  }
}

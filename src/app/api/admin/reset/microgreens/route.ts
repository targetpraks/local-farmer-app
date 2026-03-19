import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    await prisma.microgreen.deleteMany()
    return NextResponse.json({
      success: true,
      message: 'All microgreens deleted'
    })
  } catch (error) {
    console.error('Failed to reset microgreens:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reset microgreens' },
      { status: 500 }
    )
  }
}

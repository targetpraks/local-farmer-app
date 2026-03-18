import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  markupPercent: z.number().optional(),
  markupType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FIXED_PRICE']).optional(),
  markupValue: z.number().min(0).optional(),
  minimumMargin: z.number().min(0).optional(),
  volumeDiscountThreshold: z.number().min(0).optional(),
  volumeDiscountPercent: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
  priority: z.number().int().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tier = await prisma.customerTier.findUnique({
      where: { id: params.id },
      include: {
        prices: {
          include: {
            microgreen: true,
            mix: true
          }
        },
        subscriptions: true
      }
    })

    if (!tier) {
      return NextResponse.json(
        { error: 'Customer tier not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: tier })
  } catch (error) {
    console.error('Error fetching customer tier:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer tier' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = updateSchema.parse(body)

    // Handle markupPercent -> markupValue conversion
    const updateData: any = { ...validatedData }
    if (validatedData.markupPercent !== undefined) {
      updateData.markupValue = validatedData.markupPercent
      delete updateData.markupPercent
    }

    const tier = await prisma.customerTier.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json({ data: tier })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating customer tier:', error)
    return NextResponse.json(
      { error: 'Failed to update customer tier' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.customerTier.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting customer tier:', error)
    return NextResponse.json(
      { error: 'Failed to delete customer tier' },
      { status: 500 }
    )
  }
}

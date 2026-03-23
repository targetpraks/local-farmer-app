import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const priceSchema = z.object({
  microgreenId: z.string(),
  unitType: z.enum(['PER_GRAM', 'PER_KG', 'PER_LB', 'PER_OZ', 'PER_UNIT']),
  unitPrice: z.number().min(0),
  currency: z.string().default('USD'),
  moq: z.number().min(0).optional(),
  effectiveDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
})

const patchSchema = z.object({
  unitPrice: z.number().min(0).optional(),
  unitType: z.enum(['PER_GRAM', 'PER_KG', 'PER_LB', 'PER_OZ', 'PER_UNIT']).optional(),
  moq: z.number().min(0).optional(),
  expiryDate: z.string().datetime().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = priceSchema.parse(body)

    // Mark existing prices as not current
    await prisma.supplierPrice.updateMany({
      where: {
        supplierId: params.id,
        microgreenId: validatedData.microgreenId,
        isCurrent: true
      },
      data: { isCurrent: false }
    })

    const price = await prisma.supplierPrice.create({
      data: {
        supplierId: params.id,
        microgreenId: validatedData.microgreenId,
        unitType: validatedData.unitType,
        unitPrice: validatedData.unitPrice,
        currency: validatedData.currency,
        moq: validatedData.moq || null,
        effectiveDate: validatedData.effectiveDate ? new Date(validatedData.effectiveDate) : new Date(),
        expiryDate: validatedData.expiryDate ? new Date(validatedData.expiryDate) : null,
        isCurrent: true
      },
      include: {
        microgreen: true
      }
    })

    return NextResponse.json({ data: price }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating supplier price:', error)
    return NextResponse.json(
      { error: 'Failed to create supplier price' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const currentOnly = searchParams.get('currentOnly') === 'true'

    const prices = await prisma.supplierPrice.findMany({
      where: {
        supplierId: params.id,
        ...(currentOnly && { isCurrent: true })
      },
      include: {
        microgreen: true
      },
      orderBy: {
        effectiveDate: 'desc'
      }
    })

    return NextResponse.json({ data: prices })
  } catch (error) {
    console.error('Error fetching supplier prices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch supplier prices' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const priceId = searchParams.get('priceId')
    
    if (!priceId) {
      return NextResponse.json(
        { error: 'priceId query parameter is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = patchSchema.parse(body)

    // Build update data only with provided fields
    const updateData: any = {}
    if (validatedData.unitPrice !== undefined) updateData.unitPrice = validatedData.unitPrice
    if (validatedData.unitType !== undefined) updateData.unitType = validatedData.unitType
    if (validatedData.moq !== undefined) updateData.moq = validatedData.moq
    if (validatedData.expiryDate !== undefined) updateData.expiryDate = new Date(validatedData.expiryDate)

    const price = await prisma.supplierPrice.update({
      where: { id: priceId },
      data: updateData,
      include: { microgreen: true }
    })

    return NextResponse.json({ data: price })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating supplier price:', error)
    return NextResponse.json(
      { error: 'Failed to update supplier price' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const priceId = searchParams.get('priceId')
    
    if (!priceId) {
      return NextResponse.json(
        { error: 'priceId query parameter is required' },
        { status: 400 }
      )
    }

    await prisma.supplierPrice.delete({
      where: { id: priceId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting supplier price:', error)
    return NextResponse.json(
      { error: 'Failed to delete supplier price' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSupplierCode } from '@/lib/sku-generator'
import { z } from 'zod'

const supplierSchema = z.object({
  name: z.string().min(1),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  paymentTerms: z.string().optional(),
  leadTimeDays: z.number().min(0).optional(),
  minOrderAmount: z.number().min(0).optional(),
  isPreferred: z.boolean().optional(),
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const isActive = searchParams.get('isActive')
    const isPreferred = searchParams.get('isPreferred')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }
    
    if (isPreferred !== null) {
      where.isPreferred = isPreferred === 'true'
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { prices: true }
          }
        }
      }),
      prisma.supplier.count({ where })
    ])

    return NextResponse.json({
      data: suppliers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = supplierSchema.parse(body)

    const code = await generateSupplierCode()

    const supplier = await prisma.supplier.create({
      data: {
        ...validatedData,
        code,
        email: validatedData.email || null,
        website: validatedData.website || null,
      }
    })

    return NextResponse.json({ data: supplier }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating supplier:', error)
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    )
  }
}

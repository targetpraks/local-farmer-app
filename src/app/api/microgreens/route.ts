import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateMicrogreenSKU } from '@/lib/sku-generator'
import { z } from 'zod'

const microgreenSchema = z.object({
  name: z.string().min(1),
  variety: z.string().optional(),
  description: z.string().optional(),
  growTime: z.number().min(1),
  yieldPerTray: z.number().min(0),
  seedingDensity: z.number().min(0),
  defaultSeedCostPerGram: z.number().min(0).optional(),
  defaultSoilCostPerTray: z.number().min(0).optional(),
  defaultTrayCost: z.number().min(0).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
})

export async function GET(request: NextRequest) {
  const start = Date.now()
  const log = (msg: string) => {
    const line = `[${new Date().toISOString()}] ${msg}\n`
    try {
      require('fs').appendFileSync('/tmp/microgreens-api.log', line)
    } catch {}
    console.log(line)
  }
  
  log('✅ API hit')
  try {
    // Use request.nextUrl instead of constructing URL from request.url to avoid dynamic server usage
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { variety: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const [microgreens, total] = await Promise.all([
      prisma.microgreen.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { mixComponents: true, supplierPrices: true }
          }
        }
      }),
      prisma.microgreen.count({ where })
    ])

    return NextResponse.json({
      data: microgreens,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching microgreens:', error)
    return NextResponse.json(
      { error: 'Failed to fetch microgreens' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = microgreenSchema.parse(body)

    const sku = await generateMicrogreenSKU()

    const microgreen = await prisma.microgreen.create({
      data: {
        ...validatedData,
        sku,
        imageUrl: validatedData.imageUrl || null,
      }
    })

    return NextResponse.json({ data: microgreen }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating microgreen:', error)
    return NextResponse.json(
      { error: 'Failed to create microgreen' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateMixSKU } from '@/lib/sku-generator'
import { z } from 'zod'

const mixSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  totalWeight: z.number().min(0),
  servingSize: z.number().min(0),
  imageUrl: z.string().url().optional().or(z.literal('')),
  components: z.array(z.object({
    microgreenId: z.string(),
    percentage: z.number().min(0).max(100),
    weightGrams: z.number().min(0),
  })).min(1, 'At least one component is required'),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const isActive = searchParams.get('isActive')
    const isTemplate = searchParams.get('isTemplate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }
    
    if (isTemplate !== null) {
      where.isTemplate = isTemplate === 'true'
    }

    const [mixes, total] = await Promise.all([
      prisma.mix.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          components: {
            include: { microgreen: true }
          },
          _count: {
            select: { costings: true }
          }
        }
      }),
      prisma.mix.count({ where })
    ])

    return NextResponse.json({
      data: mixes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching mixes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mixes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = mixSchema.parse(body)

    const sku = await generateMixSKU()
    
    // Calculate servings per batch
    const servingsPerBatch = Math.floor(validatedData.totalWeight / validatedData.servingSize)

    // Create mix with components
    const mix = await prisma.mix.create({
      data: {
        sku,
        name: validatedData.name,
        description: validatedData.description,
        totalWeight: validatedData.totalWeight,
        servingSize: validatedData.servingSize,
        servingsPerBatch,
        imageUrl: validatedData.imageUrl || null,
        components: {
          create: validatedData.components.map(c => ({
            microgreenId: c.microgreenId,
            percentage: c.percentage,
            weightGrams: c.weightGrams,
          }))
        }
      },
      include: {
        components: {
          include: { microgreen: true }
        }
      }
    })

    return NextResponse.json({ data: mix }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating mix:', error)
    return NextResponse.json(
      { error: 'Failed to create mix' },
      { status: 500 }
    )
  }
}

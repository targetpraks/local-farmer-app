import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const EXPORTABLE_ENTITIES = [
  'microgreens',
  'mixes',
  'suppliers',
  'customerTiers',
  'subscriptionPlans',
  'users',
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entity = searchParams.get('entity')
    const format = searchParams.get('format') || 'json'

    if (!entity || !EXPORTABLE_ENTITIES.includes(entity)) {
      return NextResponse.json(
        { error: 'Invalid or missing entity' },
        { status: 400 }
      )
    }

    let data: any[] = []

    switch (entity) {
      case 'microgreens':
        data = await prisma.microgreen.findMany({
          include: {
            costings: { where: { isDefault: true } },
            supplierPrices: { include: { supplier: true } }
          }
        })
        break
      case 'mixes':
        data = await prisma.mix.findMany({
          include: {
            components: { include: { microgreen: true } },
            costings: { where: { isDefault: true } }
          }
        })
        break
      case 'suppliers':
        data = await prisma.supplier.findMany({
          include: { prices: { include: { microgreen: true } } }
        })
        break
      case 'customerTiers':
        data = await prisma.customerTier.findMany({
          include: { prices: true }
        })
        break
      case 'subscriptionPlans':
        data = await prisma.subscriptionPlan.findMany({
          include: { tier: true }
        })
        break
      case 'users':
        data = await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          }
        })
        break
    }

    if (format === 'csv') {
      // Simple CSV conversion
      if (data.length === 0) {
        return NextResponse.json({ error: 'No data to export' }, { status: 404 })
      }

      const headers = Object.keys(data[0])
      const csvRows = [
        headers.join(','),
        ...data.map(row => 
          headers.map(h => {
            const val = (row as any)[h]
            if (val === null || val === undefined) return ''
            if (typeof val === 'string' && val.includes(',')) return `"${val.replace(/"/g, '""')}"`
            if (val instanceof Date) return val.toISOString()
            return String(val)
          }).join(',')
        )
      ]
      
      const csv = csvRows.join('\n')
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${entity}.csv"`
        }
      })
    }

    return NextResponse.json({ data, count: data.length })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}

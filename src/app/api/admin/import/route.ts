import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const IMPORTABLE_ENTITIES = ['microgreens', 'suppliers']

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entity = searchParams.get('entity')
    const format = searchParams.get('format') || 'json'

    if (!entity || !IMPORTABLE_ENTITIES.includes(entity)) {
      return NextResponse.json(
        { error: 'Invalid or missing entity' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const data = body.data || body

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: 'No data provided for import' },
        { status: 400 }
      )
    }

    let created = 0
    let errors: { row: number; error: string }[] = []

    if (entity === 'microgreens') {
      for (let i = 0; i < data.length; i++) {
        try {
          const item = data[i]
          const existing = await prisma.microgreen.findFirst({
            where: { sku: item.sku }
          })

          if (!existing) {
            await prisma.microgreen.create({
              data: {
                sku: item.sku,
                name: item.name,
                variety: item.variety,
                description: item.description,
                growTime: item.growTime || 0,
                yieldPerTray: item.yieldPerTray || 0,
                seedingDensity: item.seedingDensity || 0,
                defaultSeedCostPerGram: item.defaultSeedCostPerGram,
                defaultSoilCostPerTray: item.defaultSoilCostPerTray,
                defaultTrayCost: item.defaultTrayCost,
                imageUrl: item.imageUrl,
                isActive: item.isActive ?? true,
              }
            })
            created++
          }
        } catch (err) {
          errors.push({ row: i, error: (err as Error).message })
        }
      }
    } else if (entity === 'suppliers') {
      for (let i = 0; i < data.length; i++) {
        try {
          const item = data[i]
          const existing = await prisma.supplier.findFirst({
            where: { code: item.code }
          })

          if (!existing) {
            await prisma.supplier.create({
              data: {
                code: item.code,
                name: item.name,
                contactName: item.contactName,
                email: item.email,
                phone: item.phone,
                address: item.address,
                website: item.website,
                paymentTerms: item.paymentTerms,
                leadTimeDays: item.leadTimeDays,
                minOrderAmount: item.minOrderAmount,
                isPreferred: item.isPreferred ?? false,
                rating: item.rating,
                notes: item.notes,
                isActive: item.isActive ?? true,
              }
            })
            created++
          }
        } catch (err) {
          errors.push({ row: i, error: (err as Error).message })
        }
      }
    }

    // Log import
    await prisma.exportImportLog.create({
      data: {
        type: 'IMPORT',
        entity,
        format: format.toUpperCase(),
        recordCount: created,
        status: errors.length > 0 ? 'COMPLETED' : 'COMPLETED',
        errorMessage: errors.length > 0 ? `${errors.length} errors` : null,
        completedAt: new Date(),
      }
    })

    return NextResponse.json({
      success: true,
      created,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Error importing data:', error)
    return NextResponse.json(
      { error: 'Failed to import data' },
      { status: 500 }
    )
  }
}

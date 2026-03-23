import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface MicrogreenImportRow {
  seedCode: string
  name: string
  seedingDensity?: number
  yieldPerTray?: number
  defaultSeedCostPerGram?: number
  variety?: string
}

function parseCSV(csvText: string): MicrogreenImportRow[] {
  const lines = csvText.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []

  // Try to detect delimiter
  const delimiter = lines[0].includes(',') ? ',' : lines[0].includes(';') ? ';' : '\t'

  const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase())

  const rows: MicrogreenImportRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''))
    const row: any = {}
    headers.forEach((header, index) => {
      const value = values[index]
      if (header.includes('code') || header.includes('seed') || header.includes('seedcode')) {
        row.seedCode = value
      } else if (header.includes('name') || header.includes('description')) {
        row.name = value
      } else if (header.includes('seeding') || header.includes('density')) {
        row.seedingDensity = parseFloat(value) || undefined
      } else if (header.includes('yield')) {
        row.yieldPerTray = parseFloat(value) || undefined
      } else if (header.includes('cost') && header.includes('gram')) {
        row.defaultSeedCostPerGram = parseFloat(value) || undefined
      } else if (header.includes('variety')) {
        row.variety = value
      }
    })
    if (row.seedCode && row.name) {
      rows.push(row)
    }
  }
  return rows
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const rows = parseCSV(body)

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid data found in CSV' },
        { status: 400 }
      )
    }

    // Upsert each microgreen
    const results = []
    for (const row of rows) {
      const data: any = {
        seedCode: row.seedCode,
        name: row.name,
        variety: row.variety,
        seedingDensity: row.seedingDensity,
        yieldPerTray: row.yieldPerTray,
        defaultSeedCostPerGram: row.defaultSeedCostPerGram,
      }
      // Remove undefined values
      Object.keys(data).forEach(key => data[key] === undefined && delete data[key])

      const microgreen = await prisma.microgreen.upsert({
        where: { sku: row.seedCode },
        update: data,
        create: {
          ...data,
          isActive: true,
          listPricePerGram: 0, // will be calculated in costing page
        }
      })
      results.push(microgreen)
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: `Imported ${results.length} microgreens`
    })
  } catch (error) {
    console.error('Failed to import microgreens:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to import microgreens' },
      { status: 500 }
    )
  }
}

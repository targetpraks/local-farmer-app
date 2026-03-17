import prisma from './prisma'

export async function generateSKU(prefix: string): Promise<string> {
  const tableMap: Record<string, string> = {
    'MIC': 'microgreens',
    'MIX': 'mixes',
    'SUP': 'suppliers',
    'SUB': 'subscription_plans',
  }
  
  const tableName = tableMap[prefix]
  if (!tableName) {
    throw new Error(`Unknown SKU prefix: ${prefix}`)
  }

  // Get the highest existing number for this prefix
  const existing = await prisma.$queryRawUnsafe<Array<{ sku: string }>>(`
    SELECT sku FROM "${tableName}" WHERE sku LIKE '${prefix}-%'
    ORDER BY sku DESC LIMIT 1
  `)

  let nextNumber = 1
  if (existing.length > 0 && existing[0]) {
    const match = existing[0].sku.match(/-(\d+)$/)
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1
    }
  }

  return `${prefix}-${nextNumber.toString().padStart(3, '0')}`
}

export async function generateMicrogreenSKU(): Promise<string> {
  return generateSKU('MIC')
}

export async function generateMixSKU(): Promise<string> {
  return generateSKU('MIX')
}

export async function generateSupplierCode(): Promise<string> {
  return generateSKU('SUP')
}

export async function generateSubscriptionSKU(): Promise<string> {
  return generateSKU('SUB')
}

import SeedCostingClient from './SeedCostingClient'
import { MicrogreenCost, ProductionCostConfig } from './SeedCostingClient'
import { prisma } from '@/lib/prisma'

const defaultProductionConfig: ProductionCostConfig = {
  trayCost: 50,
  trayUses: 1000,
  fabricPaperCost: 2,
  soilCostPerKg: 15,
  soilPerTrayGrams: 500,
  waterCostPerTray: 1,
  electricityCostPerTray: 2,
  laborCostPerTray: 5,
  markupPercent: 100,
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SeedCostingPage() {
  // Fetch data directly from database
  const [microgreensDb, productionConfigDb] = await Promise.all([
    prisma.microgreen.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      take: 200,
    }),
    prisma.productionCostConfig.findFirst({
      orderBy: { updatedAt: 'desc' }
    })
  ])

  const microgreens: MicrogreenCost[] = microgreensDb.map(m => ({
    id: m.id,
    name: m.name,
    variety: m.variety || undefined,
    seedCode: m.seedCode || '',
    seedingDensity: m.seedingDensity,
    yieldPerTray: m.yieldPerTray,
    defaultSeedCostPerGram: m.defaultSeedCostPerGram ?? undefined,
    prices: {
      price1: { qty: 100, unitPrice: m.defaultSeedCostPerGram || 0, costPerGram: m.defaultSeedCostPerGram || 0 },
      price2: { qty: 100, unitPrice: 0, costPerGram: 0 },
      price3: { qty: 100, unitPrice: 0, costPerGram: 0 },
    },
    bestPrice: m.defaultSeedCostPerGram || 0,
  }))

  const productionConfig: ProductionCostConfig = productionConfigDb
    ? { 
        ...defaultProductionConfig, 
        ...productionConfigDb,
        updatedAt: productionConfigDb.updatedAt?.toISOString()
      }
    : defaultProductionConfig

  return <SeedCostingClient initialMicrogreens={microgreens} initialProductionConfig={productionConfig} />
}

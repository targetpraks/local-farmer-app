import { PrismaClient, MarkupType } from '@prisma/client'
import { allMicrogreens } from './seed-data'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Create microgreens
  for (const microgreen of allMicrogreens) {
    await prisma.microgreen.upsert({
      where: { sku: microgreen.sku },
      update: {},
      create: microgreen,
    })
  }
  console.log(`Created ${allMicrogreens.length} microgreens`)

  // Create default customer tiers
  const tiers = [
    {
      name: 'Retail',
      code: 'RETAIL',
      description: 'Standard retail customers',
      markupType: MarkupType.PERCENTAGE,
      markupValue: 100,
      minimumMargin: 50,
      priority: 1,
    },
    {
      name: 'Wholesale',
      code: 'WHOLESALE',
      description: 'Wholesale customers',
      markupType: MarkupType.PERCENTAGE,
      markupValue: 60,
      minimumMargin: 30,
      priority: 2,
    },
    {
      name: 'Restaurant',
      code: 'RESTAURANT',
      description: 'Restaurant customers',
      markupType: MarkupType.PERCENTAGE,
      markupValue: 80,
      minimumMargin: 40,
      priority: 3,
    },
  ]

  for (const tier of tiers) {
    await prisma.customerTier.upsert({
      where: { code: tier.code },
      update: {},
      create: tier,
    })
  }
  console.log(`Created ${tiers.length} customer tiers`)

  // Create default cost factors
  const costFactors = [
    { key: 'LABOR_PER_TRAY', name: 'Labor per Tray', value: 5.0, unit: 'per_tray', description: 'Labor cost per tray' },
    { key: 'WATER_PER_TRAY', name: 'Water per Tray', value: 0.5, unit: 'per_tray', description: 'Water cost per tray' },
    { key: 'ELECTRICITY_PER_TRAY', name: 'Electricity per Tray', value: 1.0, unit: 'per_tray', description: 'Electricity cost per tray' },
    { key: 'PACKAGING_PER_TRAY', name: 'Packaging per Tray', value: 2.0, unit: 'per_tray', description: 'Packaging cost per tray' },
    { key: 'OVERHEAD_PERCENT', name: 'Overhead Percentage', value: 15.0, unit: 'percent', description: 'Overhead as percentage of direct costs' },
  ]

  for (const factor of costFactors) {
    await prisma.costFactor.upsert({
      where: { key: factor.key },
      update: {},
      create: factor,
    })
  }
  console.log(`Created ${costFactors.length} cost factors`)

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

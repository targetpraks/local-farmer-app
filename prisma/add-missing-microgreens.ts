import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Missing microgreens from the mixes
const missingMicrogreens = [
  {
    sku: "MIC-051",
    name: "Spinach",
    variety: "Standard",
    seedCode: "TLF-ST-SPI-STD",
    growTime: 10,
    yieldPerTray: 120,
    seedingDensity: 20,
    defaultSeedCostPerGram: 4.50,
    defaultSoilCostPerTray: 1.25,
    defaultTrayCost: 0.50,
    isActive: true,
  },
  {
    sku: "MIC-052",
    name: "Pea Shoots",
    variety: "Standard",
    seedCode: "TLF-ST-PEA-SHO",
    growTime: 10,
    yieldPerTray: 150,
    seedingDensity: 20,
    defaultSeedCostPerGram: 5.00,
    defaultSoilCostPerTray: 1.25,
    defaultTrayCost: 0.50,
    isActive: true,
  },
  {
    sku: "MIC-053",
    name: "Lemon Basil",
    variety: "Lemon",
    seedCode: "TLF-ST-BAS-LEM",
    growTime: 12,
    yieldPerTray: 115,
    seedingDensity: 20,
    defaultSeedCostPerGram: 11.50,
    defaultSoilCostPerTray: 1.25,
    defaultTrayCost: 0.50,
    isActive: true,
  },
  {
    sku: "MIC-054",
    name: "Red Cabbage",
    variety: "Red",
    seedCode: "TLF-ST-CAB-RED",
    growTime: 10,
    yieldPerTray: 115,
    seedingDensity: 20,
    defaultSeedCostPerGram: 6.85,
    defaultSoilCostPerTray: 1.25,
    defaultTrayCost: 0.50,
    isActive: true,
  },
  {
    sku: "MIC-055",
    name: "Mustard",
    variety: "Standard",
    seedCode: "TLF-ST-MUS-STD",
    growTime: 8,
    yieldPerTray: 100,
    seedingDensity: 20,
    defaultSeedCostPerGram: 4.50,
    defaultSoilCostPerTray: 1.25,
    defaultTrayCost: 0.50,
    isActive: true,
  },
  {
    sku: "MIC-056",
    name: "Rocket",
    variety: "Standard",
    seedCode: "TLF-ST-ROC-STD",
    growTime: 8,
    yieldPerTray: 100,
    seedingDensity: 20,
    defaultSeedCostPerGram: 5.50,
    defaultSoilCostPerTray: 1.25,
    defaultTrayCost: 0.50,
    isActive: true,
  },
  {
    sku: "MIC-057",
    name: "Sunflower",
    variety: "Standard",
    seedCode: "TLF-ST-SUN-STD",
    growTime: 10,
    yieldPerTray: 150,
    seedingDensity: 20,
    defaultSeedCostPerGram: 3.50,
    defaultSoilCostPerTray: 1.25,
    defaultTrayCost: 0.50,
    isActive: true,
  },
  {
    sku: "MIC-058",
    name: "Wheatgrass",
    variety: "Standard",
    seedCode: "TLF-ST-WHE-STD",
    growTime: 10,
    yieldPerTray: 150,
    seedingDensity: 20,
    defaultSeedCostPerGram: 2.50,
    defaultSoilCostPerTray: 1.25,
    defaultTrayCost: 0.50,
    isActive: true,
  },
  {
    sku: "MIC-059",
    name: "Parsley",
    variety: "Standard",
    seedCode: "TLF-ST-PAR-STD",
    growTime: 14,
    yieldPerTray: 100,
    seedingDensity: 20,
    defaultSeedCostPerGram: 6.00,
    defaultSoilCostPerTray: 1.25,
    defaultTrayCost: 0.50,
    isActive: true,
  },
  {
    sku: "MIC-060",
    name: "Corn Shoots",
    variety: "Standard",
    seedCode: "TLF-ST-COR-SHO",
    growTime: 10,
    yieldPerTray: 120,
    seedingDensity: 20,
    defaultSeedCostPerGram: 4.00,
    defaultSoilCostPerTray: 1.25,
    defaultTrayCost: 0.50,
    isActive: true,
  },
  {
    sku: "MIC-061",
    name: "Popcorn",
    variety: "Standard",
    seedCode: "TLF-ST-POP-STD",
    growTime: 10,
    yieldPerTray: 150,
    seedingDensity: 20,
    defaultSeedCostPerGram: 3.00,
    defaultSoilCostPerTray: 1.25,
    defaultTrayCost: 0.50,
    isActive: true,
  },
]

async function main() {
  console.log('Adding missing microgreens...')

  for (const microgreen of missingMicrogreens) {
    await prisma.microgreen.upsert({
      where: { sku: microgreen.sku },
      update: {},
      create: microgreen,
    })
  }

  console.log(`Added ${missingMicrogreens.length} missing microgreens`)

  // Now update the mixes with complete components
  console.log('\nUpdating mixes with complete components...')

  // Get all microgreens
  const microgreens = await prisma.microgreen.findMany()
  
  // Delete existing mixes and recreate them properly
  await prisma.mixComponent.deleteMany({})
  await prisma.mix.deleteMany({})

  const mixesData = [
    {
      name: 'Green Mix',
      description: 'A fresh and nutritious blend of green microgreens',
      components: ['Broccoli', 'Kale', 'Spinach', 'Pea Shoots'],
    },
    {
      name: 'Luxury Mix',
      description: 'Premium blend with unique flavors',
      components: ['Lemon Basil', 'Amaranth', 'Coriander', 'Fennel'],
    },
    {
      name: 'Rainbow Mix',
      description: 'Colorful variety of microgreens',
      components: ['Red Cabbage', 'Kohlrabi', 'Carrot', 'Swiss Chard'],
    },
    {
      name: 'Spicy Mix',
      description: 'Bold and spicy flavors',
      components: ['Radish', 'Mustard', 'Rocket', 'Watercress'],
    },
    {
      name: 'Superfood Mix',
      description: 'Nutrient-dense superfood blend',
      components: ['Broccoli', 'Kale', 'Sunflower', 'Wheatgrass'],
    },
    {
      name: 'Superfood Plus',
      description: 'Enhanced superfood variety',
      components: ['Wheatgrass', 'Swiss Chard', 'Parsley', 'Beetroot'],
    },
    {
      name: 'Sweet Mix',
      description: 'Mild and sweet flavor profile',
      components: ['Pea Shoots', 'Corn Shoots', 'Carrot', 'Popcorn'],
    },
  ]

  let mixCount = 0

  for (const mixData of mixesData) {
    const mixComponents: { microgreenId: string; percentage: number; weightGrams: number }[] = []
    
    for (const componentName of mixData.components) {
      const matchingMicrogreen = microgreens.find(mg => 
        mg.name.toLowerCase().includes(componentName.toLowerCase()) ||
        componentName.toLowerCase().includes(mg.name.toLowerCase())
      )
      
      if (matchingMicrogreen) {
        mixComponents.push({
          microgreenId: matchingMicrogreen.id,
          percentage: 25,
          weightGrams: 25,
        })
      }
    }

    if (mixComponents.length > 0) {
      const mix = await prisma.mix.create({
        data: {
          sku: `MIX-${String(mixCount + 1).padStart(3, '0')}`,
          name: mixData.name,
          description: mixData.description,
          totalWeight: 100,
          servingSize: 25,
          servingsPerBatch: 4,
          isActive: true,
          components: {
            create: mixComponents,
          },
        },
      })
      
      console.log(`Created mix: ${mix.name} with ${mixComponents.length} components`)
      mixCount++
    }
  }

  console.log(`\nCreated ${mixCount} mixes with complete components!`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

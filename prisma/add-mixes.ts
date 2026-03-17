import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Mix data from the images
const mixesData = [
  {
    name: 'Green Mix',
    description: 'A fresh and nutritious blend of green microgreens',
    components: [
      { name: 'Broccoli', percentage: 25 },
      { name: 'Kale', percentage: 25 },
      { name: 'Spinach', percentage: 25 },
      { name: 'Pea Shoots', percentage: 25 },
    ],
  },
  {
    name: 'Luxury Mix',
    description: 'Premium blend with unique flavors',
    components: [
      { name: 'Lemon Basil', percentage: 25 },
      { name: 'Amaranth (Red)', percentage: 25 },
      { name: 'Coriander', percentage: 25 },
      { name: 'Fennel', percentage: 25 },
    ],
  },
  {
    name: 'Rainbow Mix',
    description: 'Colorful variety of microgreens',
    components: [
      { name: 'Red Cabbage', percentage: 25 },
      { name: 'Kohlrabi', percentage: 25 },
      { name: 'Carrot', percentage: 25 },
      { name: 'Swiss Chard', percentage: 25 },
    ],
  },
  {
    name: 'Spicy Mix',
    description: 'Bold and spicy flavors',
    components: [
      { name: 'Radish', percentage: 25 },
      { name: 'Mustard', percentage: 25 },
      { name: 'Rocket', percentage: 25 },
      { name: 'Watercress', percentage: 25 },
    ],
  },
  {
    name: 'Superfood Mix',
    description: 'Nutrient-dense superfood blend',
    components: [
      { name: 'Broccoli', percentage: 25 },
      { name: 'Kale', percentage: 25 },
      { name: 'Sunflower', percentage: 25 },
      { name: 'Wheatgrass', percentage: 25 },
    ],
  },
  {
    name: 'Superfood Plus',
    description: 'Enhanced superfood variety',
    components: [
      { name: 'Wheatgrass', percentage: 25 },
      { name: 'Swiss Chard', percentage: 25 },
      { name: 'Parsley', percentage: 25 },
      { name: 'Beetroot', percentage: 25 },
    ],
  },
  {
    name: 'Sweet Mix',
    description: 'Mild and sweet flavor profile',
    components: [
      { name: 'Pea Shoots', percentage: 25 },
      { name: 'Corn Shoots', percentage: 25 },
      { name: 'Carrot', percentage: 25 },
      { name: 'Popcorn', percentage: 25 },
    ],
  },
]

async function main() {
  console.log('Adding mixes...')

  // Get all microgreens from database
  const microgreens = await prisma.microgreen.findMany()
  console.log(`Found ${microgreens.length} microgreens in database`)

  let mixCount = 0

  for (const mixData of mixesData) {
    // Find matching microgreens for each component
    const mixComponents: { microgreenId: string; percentage: number; weightGrams: number }[] = []
    
    for (const component of mixData.components) {
      // Try to find matching microgreen by name (case insensitive partial match)
      const matchingMicrogreen = microgreens.find(mg => 
        mg.name.toLowerCase().includes(component.name.toLowerCase()) ||
        component.name.toLowerCase().includes(mg.name.toLowerCase())
      )
      
      if (matchingMicrogreen) {
        mixComponents.push({
          microgreenId: matchingMicrogreen.id,
          percentage: component.percentage,
          weightGrams: 25, // 25g per component for 100g total
        })
      } else {
        console.log(`Warning: Could not find microgreen matching "${component.name}" for mix "${mixData.name}"`)
      }
    }

    if (mixComponents.length > 0) {
      // Create the mix
      const mix = await prisma.mix.create({
        data: {
          sku: `MIX-${String(mixCount + 1).padStart(3, '0')}`,
          name: mixData.name,
          description: mixData.description,
          totalWeight: 100, // 100g total
          servingSize: 25, // 25g per serving
          servingsPerBatch: 4,
          isActive: true,
          components: {
            create: mixComponents,
          },
        },
      })
      
      console.log(`Created mix: ${mix.name} with ${mixComponents.length} components`)
      mixCount++
    } else {
      console.log(`Skipping mix "${mixData.name}" - no matching microgreens found`)
    }
  }

  console.log(`\nCreated ${mixCount} mixes successfully!`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

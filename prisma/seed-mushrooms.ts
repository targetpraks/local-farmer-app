import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding mushroom varieties...')

  const varieties = [
    { slug: 'pearl',  displayName: 'Pearl Oyster',  colour: '#f5f0dc', targetMarginPct: 35 },
    { slug: 'blue',   displayName: 'Blue Oyster',   colour: '#6b8e9f', targetMarginPct: 35 },
    { slug: 'pink',   displayName: 'Pink Oyster',   colour: '#f4a0a0', targetMarginPct: 38 },
    { slug: 'golden', displayName: 'Golden Oyster', colour: '#e8c44a', targetMarginPct: 40 },
    { slug: 'king',   displayName: 'King Oyster',   colour: '#d4a86a', targetMarginPct: 42 },
  ]

  for (const v of varieties) {
    await prisma.mushroomVariety.upsert({
      where: { slug: v.slug },
      update: { displayName: v.displayName, colour: v.colour, targetMarginPct: v.targetMarginPct },
      create: v,
    })
    console.log(`  ✓ ${v.displayName}`)
  }

  // Magic Mix seed price
  await prisma.magicMixPrice.upsert({
    where: { id: 'magic-mix-default' },
    update: {},
    create: {
      id: 'magic-mix-default',
      hardwoodPelletPrice: 8.00,
      wheatBranPrice: 12.00,
      spawnPrice: 110.00,
      growBagPrice: 10.00,
      waterPricePerLitre: 0.01,
    },
  })
  console.log('  ✓ Magic Mix price config')

  console.log('✅ Mushroom seeding complete')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

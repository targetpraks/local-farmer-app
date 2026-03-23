import { prisma } from '@/lib/prisma'
import { MushroomPricesClient } from '@/components/mushrooms/MushroomPricesClient'

export const dynamic = 'force-dynamic'

export default async function MushroomPricesPage() {
  const varieties = await prisma.mushroomVariety.findMany({
    where: { isActive: true },
    include: { batches: { include: { priceRecords: true } } },
    orderBy: { displayName: 'asc' },
  })
  return <MushroomPricesClient varieties={JSON.parse(JSON.stringify(varieties))} />
}

import { prisma } from '@/lib/prisma'
import { MushroomNewBatchClient } from '@/components/mushrooms/MushroomNewBatchClient'

export const dynamic = 'force-dynamic'

export default async function NewMushroomPage() {
  const varieties = await prisma.mushroomVariety.findMany({ where: { isActive: true } })
  return <MushroomNewBatchClient varieties={JSON.parse(JSON.stringify(varieties))} />
}

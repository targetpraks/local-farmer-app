import { prisma } from '@/lib/prisma'
import { MushroomBatchDetail } from '@/components/mushrooms/MushroomBatchDetail'

export const dynamic = 'force-dynamic'

export default async function BatchDetailPage({ params }: { params: { id: string } }) {
  const batch = await prisma.mushroomBatch.findUnique({
    where: { id: params.id },
    include: {
      variety: true,
      harvests: { orderBy: { flushNumber: 'asc' } },
      costings: true,
      priceRecords: true,
    },
  })
  if (!batch) return <div>Batch not found</div>

  return <MushroomBatchDetail batch={JSON.parse(JSON.stringify(batch))} />
}

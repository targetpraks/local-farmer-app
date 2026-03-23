import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { MushroomBatchClient } from '@/components/mushrooms/MushroomBatchClient'

export const dynamic = 'force-dynamic'

export default async function MushroomsPage() {
  const batches = await prisma.mushroomBatch.findMany({
    include: {
      variety: true,
      harvests: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🍄 Mushrooms</h1>
          <p className="text-gray-500 text-sm mt-0.5">TLF: Mushrooms — batch tracking and costing</p>
        </div>
        <Link
          href="/mushrooms/new"
          className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:shadow-lg transition-all"
        >
          + New Batch
        </Link>
      </div>

      <MushroomBatchClient batches={JSON.parse(JSON.stringify(batches))} />
    </div>
  )
}

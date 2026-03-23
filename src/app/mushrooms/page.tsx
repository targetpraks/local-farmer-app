import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { MushroomBatchClient } from '@/components/mushrooms/MushroomBatchClient'
import { MushroomPricesInline } from '@/components/mushrooms/MushroomPricesInline'

export const dynamic = 'force-dynamic'

export default async function MushroomsPage() {
  const [varieties, batches] = await Promise.all([
    prisma.mushroomVariety.findMany({
      where: { isActive: true },
      include: { batches: { include: { priceRecords: true } } },
      orderBy: { displayName: 'asc' },
    }).catch(() => []),
    prisma.mushroomBatch.findMany({
      include: {
        variety: true,
        harvests: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }).catch(() => []),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🍄 Mushrooms</h1>
          <p className="text-gray-500 text-sm mt-0.5">TLF: Mushrooms — varieties, pricing, and batch tracking</p>
        </div>
        <Link
          href="/mushrooms/new"
          className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:shadow-lg transition-all"
        >
          + New Mushroom
        </Link>
      </div>

      {/* Inline price list with editable margins per gram */}
      <MushroomPricesInline varieties={JSON.parse(JSON.stringify(varieties))} />

      {/* Recent batches */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900 text-base">Recent Batches</h2>
          <Link href="/mushrooms" className="text-xs text-orange-600 hover:underline font-medium">
            View all →
          </Link>
        </div>
        <MushroomBatchClient batches={JSON.parse(JSON.stringify(batches))} />
      </div>
    </div>
  )
}

import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { MushroomPricesInline } from '@/components/mushrooms/MushroomPricesInline'

export const dynamic = 'force-dynamic'

export default async function MushroomsPage() {
  const varieties = await prisma.mushroomVariety.findMany({
    where: { isActive: true },
    orderBy: { displayName: 'asc' },
  }).catch(() => [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🍄 Mushrooms</h1>
          <p className="text-gray-500 text-sm mt-0.5">TLF: Mushrooms — varieties and pricing</p>
        </div>
        <Link
          href="/mushrooms/new"
          className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg transition-all"
        >
          + Add Mushroom Variety
        </Link>
      </div>

      {/* Inline price list with editable margins per gram */}
      <MushroomPricesInline varieties={JSON.parse(JSON.stringify(varieties))} />
    </div>
  )
}

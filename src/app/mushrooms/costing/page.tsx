import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { SpawnCostTable } from '@/components/mushrooms/SpawnCostTable'

export const dynamic = 'force-dynamic'

// Default spawn costs per variety (R/kg)
const SPAWN_COSTS: Record<string, number> = {
  'pearl-oyster': 90,
  'blue-oyster': 105,
  'pink-oyster': 108,
  'golden-oyster': 115,
  'king-oyster': 125,
}

const COLOURS: Record<string, string> = {
  'pearl-oyster': '#e8d5b7',
  'blue-oyster': '#7eb8da',
  'pink-oyster': '#f4a6b0',
  'golden-oyster': '#f5d76e',
  'king-oyster': '#c9a9e4',
}

const MAGIC_MIX_COST_PER_KG = 16.95

function calcCostPerGram(spawnCost: number): number {
  const spawnCostPerBag = spawnCost * 0.1
  const substrateCostPerBag = MAGIC_MIX_COST_PER_KG * 2
  const totalCostPerBag = substrateCostPerBag + spawnCostPerBag
  return totalCostPerBag / 800
}

export default async function MushroomCostingPage() {
  const varieties = await prisma.mushroomVariety.findMany({
    where: { isActive: true },
    orderBy: { displayName: 'asc' },
  }).catch(() => [])

  const varietyData = varieties.map(v => {
    const spawnCost = SPAWN_COSTS[v.slug] ?? 100
    return {
      id: v.id,
      slug: v.slug,
      displayName: v.displayName,
      colour: v.colour ?? COLOURS[v.slug] ?? '#888',
      spawnCost,
      costPerGram: calcCostPerGram(spawnCost),
    }
  })

  const avgSpawnCost = varietyData.length > 0
    ? varietyData.reduce((s, v) => s + v.spawnCost, 0) / varietyData.length
    : 0

  const cheapest = varietyData.reduce((min, v) => v.spawnCost < min.spawnCost ? v : min, varietyData[0])
  const expensive = varietyData.reduce((max, v) => v.spawnCost > max.spawnCost ? v : max, varietyData[0])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/mushrooms" className="hover:text-gray-700">Mushrooms</Link>
            <span>›</span><span>Spawn Costing</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">🍄 Spawn Costing</h1>
          <p className="text-gray-500 text-sm mt-0.5">Spawn cost per bag by variety — linked to production and pricing</p>
        </div>
        <Link href="/mushrooms" className="text-sm text-orange-600 hover:underline font-medium">
          ← Back to Mushrooms
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Varieties</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{varietyData.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Avg Spawn Cost</p>
          <p className="text-3xl font-bold text-orange-600 mt-1">R{(avgSpawnCost * 0.1).toFixed(2)}/bag</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Cheapest</p>
          <p className="text-lg font-bold text-green-600 mt-1">
            {cheapest ? `${cheapest.displayName} — R${(cheapest.spawnCost * 0.1).toFixed(2)}/bag` : '—'}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Most Expensive</p>
          <p className="text-lg font-bold text-orange-700 mt-1">
            {expensive ? `${expensive.displayName} — R${(expensive.spawnCost * 0.1).toFixed(2)}/bag` : '—'}
          </p>
        </div>
      </div>

      {/* Spawn cost table with editable inline inputs */}
      <SpawnCostTable initialData={varietyData} />

      {/* Reference note */}
      <div className="bg-orange-50 rounded-xl border border-orange-200 p-5">
        <h3 className="font-bold text-orange-800 text-sm mb-2">📊 Spawn Cost Reference</h3>
        <ul className="text-xs text-orange-700 space-y-1">
          <li><strong>Spawn cost:</strong> R90–125/kg depending on variety and supplier</li>
          <li><strong>Inoculation rate:</strong> 5–10% spawn to substrate (100g spawn per 2kg bag)</li>
          <li><strong>Spawn cost per bag:</strong> R9–12.50 per bag (100g spawn at R90–125/kg)</li>
          <li><strong>Impact:</strong> Spawn adds ~R0.011–0.016/g to final cost-per-gram at typical yields</li>
          <li><strong>Production:</strong> See <Link href="/mushrooms/production" className="underline hover:text-orange-900">Production Costing</Link> for full substrate + labour + overhead breakdown</li>
        </ul>
      </div>
    </div>
  )
}

import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function MushroomCostingPage() {
  // Get all completed batches with their costings
  const batches = await prisma.mushroomBatch.findMany({
    where: { status: 'COMPLETED' },
    include: {
      variety: true,
      harvests: { orderBy: { flushNumber: 'asc' } },
      costings: true,
      priceRecords: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  }).catch(() => [])

  // Calculate averages
  const avgCostPerKg = batches.length > 0
    ? batches.reduce((sum, b) => {
        const costing = b.costings[0]
        return sum + (costing?.costPerKg ?? 0)
      }, 0) / batches.length
    : 0

  const totalKgHarvested = batches.reduce((sum, b) =>
    sum + b.harvests.reduce((s, h) => s + h.kgHarvested, 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/mushrooms" className="hover:text-gray-700">Mushrooms</Link>
            <span>›</span><span>Costing</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">🍄 Mushroom Costing</h1>
          <p className="text-gray-500 text-sm mt-0.5">Batch costs, yield analysis, and pricing breakdowns</p>
        </div>
        <Link href="/mushrooms" className="text-sm text-orange-600 hover:underline font-medium">
          ← Back to Batches
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total Batches</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{batches.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total Harvested</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{totalKgHarvested.toFixed(1)} kg</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Avg Cost/kg</p>
          <p className="text-3xl font-bold text-orange-600 mt-1">R{avgCostPerKg.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Magic Mix</p>
          <p className="text-3xl font-bold text-gray-700 mt-1">R16.95/kg</p>
        </div>
      </div>

      {/* Batch costings table */}
      {batches.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-4xl mb-3">🍄</p>
          <h3 className="font-bold text-gray-900 text-lg mb-1">No completed batches yet</h3>
          <p className="text-gray-500 text-sm mb-5">Complete a batch with both Round 1 and Round 2 harvests to see costing data.</p>
          <Link href="/mushrooms/new" className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl font-medium text-sm">
            Create First Batch
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Batch</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Variety</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Bags</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Substrate</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">R1 kg</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">R2 kg</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total kg</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Cost/kg</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Wholesale</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Retail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {batches.map(batch => {
                const costing = batch.costings[0]
                const pricing = batch.priceRecords[0]
                const r1 = batch.harvests.find(h => h.flushNumber === 1)?.kgHarvested ?? 0
                const r2 = batch.harvests.find(h => h.flushNumber === 2)?.kgHarvested ?? 0
                const total = r1 + r2
                return (
                  <tr key={batch.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-gray-600">{batch.batchCode}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: batch.variety?.colour ?? '#888' }} />
                        <span className="font-medium text-gray-900 text-sm">{batch.variety?.displayName ?? 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600">{batch.bagCount}</td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600">{batch.substrateKg} kg</td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-green-600">{r1.toFixed(1)}</td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-green-600">{r2.toFixed(1)}</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">{total.toFixed(1)}</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-orange-600">
                      {costing ? `R${costing.costPerKg?.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-green-700">
                      {pricing ? `R${pricing.suggestedWholesale.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-amber-700">
                      {pricing ? `R${pricing.suggestedRetail.toFixed(2)}` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pricing guide */}
      <div className="bg-orange-50 rounded-xl border border-orange-200 p-5">
        <h3 className="font-bold text-orange-800 text-sm mb-2">📊 Pricing Guide</h3>
        <ul className="text-xs text-orange-700 space-y-1">
          <li><strong>Magic Mix Cost:</strong> R16.95/kg substrate (70% hardwood pellets @ R8/kg + 30% wheat bran @ R12/kg + spawn + bag)</li>
          <li><strong>Target Margin:</strong> Pearl 35%, Blue 35%, Pink 38%, Golden 40%, King 42%</li>
          <li><strong>Wholesale = Cost ÷ (1 - Margin%)</strong> — applies to bulk orders (restaurants, resellers)</li>
          <li><strong>Retail = Wholesale × 1.25</strong> — farm gate / farmers market price</li>
        </ul>
      </div>
    </div>
  )
}
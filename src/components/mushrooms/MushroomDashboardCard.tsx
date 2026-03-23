'use client'
import Link from 'next/link'

interface MiniBatch { id: string; batchCode: string; status: string; variety: { displayName: string; colour: string } }
interface Props { batches: MiniBatch[] }

export function MushroomDashboardCard({ batches }: Props) {
  const active = batches.filter(b => b.status === 'ACTIVE').length
  const completed = batches.filter(b => b.status === 'COMPLETED').length

  return (
    <Link href="/mushrooms"
      className="block bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-200 p-6 hover:shadow-lg transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍄</span>
          <h2 className="font-bold text-gray-900">Mushrooms</h2>
        </div>
        <span className="text-xs text-orange-600 font-medium bg-orange-100 px-2 py-1 rounded-full">
          {active} active
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Active batches</span>
          <span className="font-bold text-gray-900">{active}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Completed</span>
          <span className="font-bold text-gray-900">{completed}</span>
        </div>
      </div>
      {active > 0 && (
        <div className="mt-4 pt-4 border-t border-orange-200">
          <p className="text-xs text-orange-700 font-medium">🟡 {active} batch{active !== 1 ? 'es' : ''} in progress</p>
        </div>
      )}
      <div className="mt-3 flex gap-1 flex-wrap">
        {batches.slice(0, 5).map(b => (
          <div key={b.id} className="w-2 h-2 rounded-full" style={{ backgroundColor: b.variety.colour }} />
        ))}
      </div>
    </Link>
  )
}

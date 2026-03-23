'use client'
import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'

interface Batch {
  id: string
  batchCode: string
  inoculationDate: string
  bagCount: number
  substrateKg: number
  substrateCost: number
  status: string
  variety: { slug: string; displayName: string; colour: string }
  harvests: { flushNumber: number; kgHarvested: number }[]
}

export function MushroomBatchClient({ batches }: { batches: Batch[] }) {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL')
  const filtered = batches.filter(b => {
    if (filter === 'ACTIVE') return b.status === 'ACTIVE'
    if (filter === 'COMPLETED') return b.status === 'COMPLETED'
    return true
  })

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['ALL', 'ACTIVE', 'COMPLETED'] as const).map(tab => (
          <button key={tab} onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${filter === tab ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
            {tab === 'ALL' ? 'All Batches' : tab === 'ACTIVE' ? '🟡 Active' : '✅ Completed'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-4xl mb-3">🍄</p>
          <h3 className="font-bold text-gray-900 text-lg mb-1">No batches yet</h3>
          <p className="text-gray-500 text-sm mb-5">Create your first mushroom batch to start tracking costs.</p>
          <Link href="/mushrooms/new"
            className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl font-medium text-sm">
            Create First Batch
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(batch => {
            const totalKg = batch.harvests.reduce((s, h) => s + h.kgHarvested, 0)
            const r1 = batch.harvests.find(h => h.flushNumber === 1)
            const r2 = batch.harvests.find(h => h.flushNumber === 2)
            return (
              <Link key={batch.id} href={`/mushrooms/${batch.id}`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-orange-200 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: batch.variety.colour }} />
                    <span className="font-bold text-gray-900 text-sm">{batch.variety.displayName}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${batch.status === 'ACTIVE' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                    {batch.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-mono mb-3">{batch.batchCode}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Bags</p>
                    <p className="font-bold text-gray-900 text-sm">{batch.bagCount}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">R1 kg</p>
                    <p className="font-bold text-green-600 text-sm">{r1 ? `${r1.kgHarvested}kg` : '—'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">R2 kg</p>
                    <p className="font-bold text-green-600 text-sm">{r2 ? `${r2.kgHarvested}kg` : '—'}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <p className="text-xs text-gray-400">{format(new Date(batch.inoculationDate), 'dd MMM yyyy')}</p>
                  <p className="text-xs font-medium text-orange-600 group-hover:underline">View →</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

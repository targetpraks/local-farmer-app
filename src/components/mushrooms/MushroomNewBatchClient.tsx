'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MAGIC_MIX_COST_PER_KG } from '@/lib/mushrooms/magicMix'

const VARIETY_COLOURS: Record<string, string> = {
  pearl: '#f5f0dc', blue: '#6b8e9f', pink: '#f4a0a0',
  golden: '#e8c44a', king: '#d4a86a',
}

export function MushroomNewBatchClient({ varieties }: { varieties: { id: string; slug: string; displayName: string; colour: string }[] }) {
  const router = useRouter()
  const [varietyId, setVarietyId] = useState('')
  const [bagCount, setBagCount] = useState(10)
  const [inoculationDate, setInoculationDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const substrateKg = bagCount * 2
  const substrateCost = substrateKg * MAGIC_MIX_COST_PER_KG
  const selected = varieties.find(v => v.id === varietyId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!varietyId) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/mushrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ varietyId, bagCount, inoculationDate, notes }),
      })
      if (!res.ok) throw new Error('Failed to create batch')
      const { batch } = await res.json()
      router.push(`/mushrooms/${batch.id}`)
    } catch {
      alert('Error creating batch. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <Link href="/mushrooms" className="hover:text-gray-900">Mushrooms</Link>
        <span>›</span><span>New Batch</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">🍄 New Batch</h1>
        <p className="text-gray-500 text-sm mt-0.5">All batches use the Magic Mix — one substrate for all varieties</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">

        {/* Variety selector */}
        <div>
          <p className="block text-sm font-medium text-gray-700 mb-3">Mushroom Variety</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {varieties.map(v => (
              <button type="button" key={v.id}
                onClick={() => setVarietyId(v.id)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${varietyId === v.id ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: v.colour }} />
                  <span className="text-sm font-medium text-gray-900">{v.displayName}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bag count */}
        <div>
          <p className="block text-sm font-medium text-gray-700 mb-2">Number of Grow Bags</p>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setBagCount(Math.max(1, bagCount - 1))}
              className="w-10 h-10 rounded-lg border border-gray-200 bg-white text-xl font-bold hover:bg-gray-50">−</button>
            <input type="number" min={1} value={bagCount}
              onChange={e => setBagCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24 text-center text-2xl font-bold border border-gray-200 rounded-lg py-2 bg-white" />
            <button type="button" onClick={() => setBagCount(bagCount + 1)}
              className="w-10 h-10 rounded-lg border border-gray-200 bg-white text-xl font-bold hover:bg-gray-50">+</button>
          </div>
          <p className="text-xs text-gray-400 mt-1">2 kg substrate per bag</p>
        </div>

        {/* Date */}
        <div>
          <p className="block text-sm font-medium text-gray-700 mb-2">Inoculation Date</p>
          <input type="date" value={inoculationDate}
            onChange={e => setInoculationDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2 bg-white" />
        </div>

        {/* Notes */}
        <div>
          <p className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</p>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="Any notes about this batch..."
            className="w-full border border-gray-200 rounded-lg px-4 py-2 bg-white resize-none" />
        </div>

        {/* Magic Mix cost preview */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
          <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-2">🍄 Magic Mix — Cost Preview</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Substrate ({substrateKg} kg)</span>
              <span className="font-medium">R{substrateCost.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Cost / kg substrate</span>
              <span className="font-medium">R{MAGIC_MIX_COST_PER_KG.toFixed(2)}/kg</span></div>
            <p className="text-xs text-gray-400 pt-2 border-t border-orange-200 mt-2">
              70% Hardwood Pellets + 30% Wheat Bran + Spawn. Same mix for all varieties.
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Link href="/mushrooms" className="px-6 py-3 rounded-xl border border-gray-200 text-sm hover:bg-gray-50">Cancel</Link>
          <button type="submit" disabled={!varietyId || submitting}
            className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-xl font-medium text-sm hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed">
            {submitting ? 'Creating...' : 'Create Batch'}
          </button>
        </div>
      </form>
    </div>
  )
}

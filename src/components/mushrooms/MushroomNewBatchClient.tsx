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
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const selected = varieties.find(v => v.id === varietyId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!varietyId) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/mushrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ varietyId, notes }),
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
        <span>›</span><span>New Mushroom</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">🍄 New Mushroom</h1>
        <p className="text-gray-500 text-sm mt-0.5">Add a new mushroom variety to your catalogue</p>
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

        {/* Notes */}
        <div>
          <p className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</p>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="Any notes about this batch..."
            className="w-full border border-gray-200 rounded-lg px-4 py-2 bg-white resize-none" />
        </div>

        <div className="flex gap-3 pt-2">
          <Link href="/mushrooms" className="px-6 py-3 rounded-xl border border-gray-200 text-sm hover:bg-gray-50">Cancel</Link>
          <button type="submit" disabled={!varietyId || submitting}
            className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-xl font-medium text-sm hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed">
            {submitting ? 'Adding...' : 'Add Mushroom'}
          </button>
        </div>
      </form>
    </div>
  )
}

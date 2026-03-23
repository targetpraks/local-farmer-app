'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const PRESET_COLOURS = [
  { name: 'Cream', hex: '#f5f0dc' },
  { name: 'Blue', hex: '#6b8e9f' },
  { name: 'Pink', hex: '#f4a0a0' },
  { name: 'Golden', hex: '#e8c44a' },
  { name: 'Tan', hex: '#d4a86a' },
  { name: 'Lavender', hex: '#c4a7d7' },
  { name: 'Coral', hex: '#f4a6b0' },
  { name: 'Sage', hex: '#9caf88' },
  { name: 'Mauve', hex: '#e0b0d5' },
  { name: 'Slate', hex: '#7eb8da' },
  { name: 'Amber', hex: '#f5d76e' },
  { name: 'Gray', hex: '#888888' },
]

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function MushroomNewBatchClient() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [slug, setSlug] = useState('')
  const [colour, setColour] = useState('#f5f0dc')
  const [targetMarginPct, setTargetMarginPct] = useState(35)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function handleNameChange(name: string) {
    setDisplayName(name)
    // Auto-generate slug from name
    setSlug(slugify(name))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!displayName || !slug) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/mushrooms/varieties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, slug, colour, targetMarginPct }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create variety')
      }
      router.push('/mushrooms')
    } catch (err: any) {
      setError(err.message || 'Error creating variety. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <Link href="/mushrooms" className="hover:text-gray-900">Mushrooms</Link>
        <span>›</span><span>Add Mushroom Variety</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">🍄 Add Mushroom Variety</h1>
        <p className="text-gray-500 text-sm mt-0.5">Add a new mushroom variety to your catalogue</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">

        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Display Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={displayName}
            onChange={e => handleNameChange(e.target.value)}
            placeholder="e.g., Pearl Oyster"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
            required
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Slug <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={slug}
            onChange={e => setSlug(slugify(e.target.value))}
            placeholder="pearl-oyster"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-white text-gray-900 placeholder-gray-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
            required
          />
          <p className="text-xs text-gray-400 mt-1">URL-friendly identifier, auto-generated from name</p>
        </div>

        {/* Colour */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Colour
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLOURS.map(c => (
              <button
                type="button"
                key={c.hex}
                onClick={() => setColour(c.hex)}
                className={`w-9 h-9 rounded-full border-2 transition-all hover:scale-110 ${
                  colour === c.hex ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-200'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <div
              className="w-10 h-10 rounded-full border border-gray-200"
              style={{ backgroundColor: colour }}
            />
            <input
              type="text"
              value={colour}
              onChange={e => setColour(e.target.value)}
              placeholder="#hex"
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-mono w-28 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>

        {/* Target Margin */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Margin %
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={targetMarginPct}
              onChange={e => setTargetMarginPct(parseFloat(e.target.value) || 0)}
              min={5}
              max={80}
              step={1}
              className="border border-gray-200 rounded-lg px-4 py-2.5 bg-white w-28 text-center font-medium focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <span className="text-sm text-gray-500">%</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-orange-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, (targetMarginPct / 80) * 100)}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 w-16">Typical: 35%</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Used to calculate wholesale and retail prices</p>
        </div>

        <div className="flex gap-3 pt-2">
          <Link href="/mushrooms" className="px-6 py-3 rounded-xl border border-gray-200 text-sm hover:bg-gray-50 font-medium">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!displayName || !slug || submitting}
            className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-xl font-medium text-sm hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? 'Adding Variety...' : 'Add Mushroom Variety'}
          </button>
        </div>
      </form>
    </div>
  )
}

'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Sparkles, Tag } from 'lucide-react'

const VARIETIES = [
  { slug: 'pearl',   displayName: 'Pearl Oyster',   colour: '#f5f0dc', be: 0.35 },
  { slug: 'blue',    displayName: 'Blue Oyster',     colour: '#6b8e9f', be: 0.35 },
  { slug: 'pink',    displayName: 'Pink Oyster',     colour: '#f4a0a0', be: 0.38 },
  { slug: 'golden',  displayName: 'Golden Oyster',   colour: '#e8c44a', be: 0.40 },
  { slug: 'king',    displayName: 'King Oyster',     colour: '#d4a86a', be: 0.42 },
]

const MAGIC_MIX_COST = 16.95 // R/kg substrate

interface MixComponent { varietySlug: string; percentage: number }
interface MushroomMix {
  id: string
  name: string
  description: string
  components: MixComponent[]
  targetMargin: number
  createdAt: string
}

function calcCost(components: MixComponent[]): number {
  return MAGIC_MIX_COST
}
function calcPrice(costPerKg: number, marginPct: number) {
  return {
    wholesale: Math.round(costPerKg / (1 - marginPct / 100) * 100) / 100,
    retail:    Math.round(costPerKg / (1 - marginPct / 100) * 1.25 * 100) / 100,
  }
}
function totalPct(components: MixComponent[]): number {
  return components.reduce((s, c) => s + c.percentage, 0)
}

export default function MushroomMixesPage() {
  const router = useRouter()
  const [mixes, setMixes] = useState<MushroomMix[]>([])
  const [showNew, setShowNew] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [components, setComponents] = useState<MixComponent[]>(
    VARIETIES.map(v => ({ varietySlug: v.slug, percentage: 0 }))
  )
  const [marginPct, setMarginPct] = useState(35)

  useEffect(() => {
    const raw = localStorage.getItem('tlf_mushroom_mixes')
    if (raw) setMixes(JSON.parse(raw))
  }, [])

  function saveMix() {
    if (!name.trim()) return alert('Please enter a mix name')
    const active = components.filter(c => c.percentage > 0)
    const total = totalPct(active)
    if (total === 0) return alert('At least one variety must have a percentage > 0')
    if (total !== 100) return alert(`Percentages must add up to 100% (currently ${total}%)`)

    const mix: MushroomMix = {
      id: Date.now().toString(),
      name: name.trim(),
      description: description.trim(),
      components: active,
      targetMargin: marginPct,
      createdAt: new Date().toISOString(),
    }
    const updated = [mix, ...mixes]
    setMixes(updated)
    localStorage.setItem('tlf_mushroom_mixes', JSON.stringify(updated))
    setName(''); setDescription('')
    setComponents(VARIETIES.map(v => ({ varietySlug: v.slug, percentage: 0 })))
    setMarginPct(35)
    setShowNew(false)
  }

  function deleteMix(id: string) {
    if (!confirm('Delete this mix?')) return
    const updated = mixes.filter(m => m.id !== id)
    setMixes(updated)
    localStorage.setItem('tlf_mushroom_mixes', JSON.stringify(updated))
  }

  const previewCost = calcCost(components)
  const { wholesale, retail } = calcPrice(previewCost, marginPct)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/mushrooms" className="hover:text-gray-700">Mushrooms</Link>
            <span>›</span><span>Mixes</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">🍄 Mushroom Mixes</h1>
          <p className="text-gray-500 text-sm mt-0.5">Blend varieties into custom product mixes with pricing</p>
        </div>
        <button
          onClick={() => setShowNew(!showNew)}
          className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:shadow-lg transition-all">
          {showNew ? '← Cancel' : '+ New Mix'}
        </button>
      </div>

      {/* New mix form */}
      {showNew && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="font-bold text-gray-900">Create Mushroom Mix</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mix Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Forest Blend, Gourmet Mix"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Margin %</label>
              <input type="number" value={marginPct} onChange={e => setMarginPct(Number(e.target.value))}
                min={10} max={60}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-white text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Variety Breakdown (%)</label>
            <div className="space-y-2">
              {VARIETIES.map(v => {
                const comp = components.find(c => c.varietySlug === v.slug)
                return (
                  <div key={v.slug} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: v.colour }} />
                    <span className="text-sm font-medium text-gray-700 w-36">{v.displayName}</span>
                    <input
                      type="number" min={0} max={100} value={comp?.percentage ?? 0}
                      onChange={e => {
                        const val = Number(e.target.value)
                        setComponents(prev => prev.map(c =>
                          c.varietySlug === v.slug ? { ...c, percentage: val } : c
                        ))
                      }}
                      className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" />
                    <span className="text-sm text-gray-400">%</span>
                  </div>
                )
              })}
            </div>
            <p className={`text-xs mt-1.5 ${totalPct(components) === 100 ? 'text-green-600' : 'text-red-500'}`}>
              Total: {totalPct(components)}%{' '}
              {totalPct(components) === 100 ? <span className="font-medium">✓</span> : '— must equal 100%'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              placeholder="Describe this mix..."
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-white text-sm resize-none" />
          </div>

          {/* Price preview */}
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-100 space-y-1">
            <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-2">💰 Price Preview</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500">Cost/kg</p>
                <p className="font-bold text-gray-900">R{previewCost.toFixed(2)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border-2 border-green-200">
                <p className="text-xs text-green-700">Wholesale/kg</p>
                <p className="font-bold text-green-800 text-lg">R{wholesale.toFixed(2)}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 border-2 border-orange-200">
                <p className="text-xs text-orange-700">Retail/kg</p>
                <p className="font-bold text-orange-800 text-lg">R{retail.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <button onClick={saveMix}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-xl font-medium text-sm hover:shadow-lg">
            Save Mix
          </button>
        </div>
      )}

      {/* Mixes grid */}
      {mixes.length === 0 && !showNew ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-4xl mb-3">🍄</p>
          <h3 className="font-bold text-gray-900 text-lg mb-1">No mixes yet</h3>
          <p className="text-gray-500 text-sm mb-5">Create your first custom mushroom variety blend.</p>
          <button onClick={() => setShowNew(true)}
            className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl font-medium text-sm">
            Create First Mix
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mixes.map(mix => {
            const cost = calcCost(mix.components)
            const { wholesale: ws, retail: rt } = calcPrice(cost, mix.targetMargin)
            const total = totalPct(mix.components)
            return (
              <div key={mix.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-gray-900">{mix.name}</h3>
                  <button onClick={() => deleteMix(mix.id)}
                    className="text-gray-300 hover:text-red-400 text-sm transition-colors">✕</button>
                </div>
                {mix.description && (
                  <p className="text-xs text-gray-500 mb-3">{mix.description}</p>
                )}
                {/* Variety bars */}
                <div className="space-y-1 mb-3">
                  {mix.components.map(c => {
                    const v = VARIETIES.find(x => x.slug === c.varietySlug)
                    return (
                      <div key={c.varietySlug} className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: v?.colour ?? '#888' }} />
                        <span className="text-gray-600 w-28">{v?.displayName}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full" style={{
                            width: `${c.percentage}%`,
                            backgroundColor: v?.colour ?? '#888',
                          }} />
                        </div>
                        <span className="text-gray-500 w-8 text-right">{c.percentage}%</span>
                      </div>
                    )
                  })}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center border-t border-gray-100 pt-3">
                  <div><p className="text-xs text-gray-400">Cost</p><p className="font-bold text-gray-700 text-sm">R{cost.toFixed(2)}</p></div>
                  <div><p className="text-xs text-green-600">Wholesale</p><p className="font-bold text-green-700 text-sm">R{ws.toFixed(2)}</p></div>
                  <div><p className="text-xs text-orange-600">Retail</p><p className="font-bold text-orange-700 text-sm">R{rt.toFixed(2)}</p></div>
                </div>
                <p className="text-xs text-center text-gray-400 mt-2">{mix.targetMargin}% margin · {total}% allocated</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
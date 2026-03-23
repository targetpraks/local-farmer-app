'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface PriceRecord { id: string; costPerKg: number; suggestedWholesale: number; suggestedRetail: number; createdAt: string }
interface Batch { id: string; batchCode: string; bagCount: number; substrateKg: number; costings: { costPerKg: number }[]; priceRecords: PriceRecord[] }
interface Variety { id: string; slug: string; displayName: string; colour: string; targetMarginPct: number; batches: Batch[] }

const DEFAULT_COST_PER_KG = 16.95 // Magic Mix cost
const MARGIN_DEFAULTS: Record<string, number> = { pearl: 35, blue: 35, pink: 38, golden: 40, king: 42 }
const MARGIN_STORAGE_KEY = 'lf_mushroom_prices_margins'

function round2(n: number) { return Math.round(n * 100) / 100 }
function round4(n: number) { return Math.round(n * 10000) / 10000 }

function calcPrice(costPerKg: number, marginPct: number) {
  const costPerGram = costPerKg / 1000
  const wholesalePerGram = round4(costPerGram / (1 - marginPct / 100))
  const retailPerGram = round4(wholesalePerGram * 1.25)
  return {
    wholesale: round2(costPerKg / (1 - marginPct / 100)),
    retail: round2(costPerKg / (1 - marginPct / 100) * 1.25),
    wholesalePerGram,
    retailPerGram,
    costPerGram,
  }
}

export function MushroomPricesClient({ varieties }: { varieties: Variety[] }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [manualCost, setManualCost] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [margins, setMargins] = useState<Record<string, number>>({})
  const [editingMarginId, setEditingMarginId] = useState<string | null>(null)
  const [editMarginVal, setEditMarginVal] = useState('')
  const [hydrated, setHydrated] = useState(false)

  // Load margins from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(MARGIN_STORAGE_KEY)
      const parsed: Record<string, number> = raw ? JSON.parse(raw) : {}
      const init: Record<string, number> = {}
      varieties.forEach(v => { init[v.slug] = parsed[v.slug] ?? MARGIN_DEFAULTS[v.slug] ?? v.targetMarginPct ?? 35 })
      setMargins(init)
    } catch { /* ignore */ }
    setHydrated(true)
  }, [varieties])

  // Persist margins
  useEffect(() => {
    if (!hydrated) return
    try { localStorage.setItem(MARGIN_STORAGE_KEY, JSON.stringify(margins)) } catch { /* ignore */ }
  }, [margins, hydrated])

  const setMargin = useCallback((slug: string, val: number) => {
    setMargins(prev => ({ ...prev, [slug]: val }))
  }, [])

  // Get the latest price for each variety
  const latestPrices = varieties.map(v => {
    const priced = v.batches
      .filter(b => b.priceRecords.length > 0)
      .sort((a, b) => new Date(b.priceRecords[0].createdAt).getTime() - new Date(a.priceRecords[0].createdAt).getTime())
    const latest = priced[0]?.priceRecords[0]
    const margin = margins[v.slug] ?? MARGIN_DEFAULTS[v.slug] ?? v.targetMarginPct ?? 35
    return {
      ...v,
      latestPrice: latest ?? null,
      margin,
      defaultCost: latest?.costPerKg ?? DEFAULT_COST_PER_KG,
    }
  })

  function handleEdit(id: string) {
    const v = latestPrices.find(x => x.id === id)
    if (!v) return
    setManualCost(prev => ({ ...prev, [id]: v.latestPrice ? String(v.latestPrice.costPerKg) : String(DEFAULT_COST_PER_KG) }))
    setEditingId(id)
  }

  function handleSave(id: string) {
    const cost = parseFloat(manualCost[id] ?? '0')
    if (!cost || cost <= 0) return
    setSaved(prev => ({ ...prev, [id]: true }))
    setEditingId(null)
  }

  if (!hydrated) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🍄 Mushroom Price List</h1>
          <p className="text-gray-500 text-sm mt-0.5">Wholesale + retail prices per variety based on Magic Mix cost — editable margins per gram</p>
        </div>
        <Link href="/mushrooms" className="text-sm text-orange-600 hover:underline font-medium">
          ← Back to Mushrooms
        </Link>
      </div>

      {/* Price table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['Variety', 'Cost/kg', 'Cost/g', 'Target Margin', 'Wholesale/g', 'Wholesale/kg', 'Retail/g', 'Retail/kg', 'Effective', ''].map(h => (
                <th key={h} className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {latestPrices.map(v => {
              const cost = editingId === v.id
                ? parseFloat(manualCost[v.id] ?? '0')
                : (v.latestPrice?.costPerKg ?? v.defaultCost)
              const { wholesale, retail, wholesalePerGram, retailPerGram, costPerGram } = calcPrice(cost, v.margin)
              const effectiveDate = v.latestPrice?.createdAt
                ? new Date(v.latestPrice.createdAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })
                : '—'

              return (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: v.colour }} />
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{v.displayName}</p>
                        <p className="text-xs text-gray-400 capitalize">{v.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {editingId === v.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-sm">R</span>
                        <input
                          type="number" min={1} step={0.5}
                          value={manualCost[v.id] ?? ''}
                          onChange={e => setManualCost(prev => ({ ...prev, [v.id]: e.target.value }))}
                          className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm font-medium"
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-gray-900 text-sm">R{cost.toFixed(2)}</p>
                        {saved[v.id] && <p className="text-xs text-green-600">✓ Saved</p>}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-600">R{costPerGram.toFixed(4)}</td>
                  <td className="px-4 py-4">
                    {editingMarginId === v.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number" min={1} max={90} step={1}
                          value={editMarginVal}
                          onChange={e => setEditMarginVal(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') { setMargin(v.slug, parseFloat(editMarginVal) || 35); setEditingMarginId(null) }
                            if (e.key === 'Escape') setEditingMarginId(null)
                          }}
                          className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-sm font-medium text-right"
                          autoFocus
                        />
                        <span className="text-gray-400 text-sm">%</span>
                        <button onClick={() => { setMargin(v.slug, parseFloat(editMarginVal) || 35); setEditingMarginId(null) }}
                          className="bg-green-600 text-white px-1.5 py-0.5 rounded text-xs font-bold hover:bg-green-700">✓</button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingMarginId(v.id); setEditMarginVal(String(v.margin)) }}
                        className="group flex items-center gap-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                          style={{ backgroundColor: v.colour + '33' }}>
                          {v.margin}%
                        </span>
                        <span className="text-gray-300 text-xs group-hover:text-orange-400">✎</span>
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-bold text-green-700 text-sm">R{wholesalePerGram.toFixed(4)}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-green-600 text-sm">R{wholesale.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">excl. VAT</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-bold text-orange-600 text-sm">R{retailPerGram.toFixed(4)}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-orange-600 text-sm">R{retail.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">farm gate</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-500">{effectiveDate}</p>
                  </td>
                  <td className="px-4 py-3">
                    {editingId === v.id ? (
                      <div className="flex gap-1.5">
                        <button onClick={() => handleSave(v.id)}
                          className="bg-green-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-green-700">
                          Save
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="bg-gray-200 text-gray-700 px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-gray-300">
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => handleEdit(v.id)}
                        className="text-orange-600 hover:text-orange-700 text-xs font-medium hover:underline">
                        Edit cost
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pricing guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-xl border border-green-200 p-5">
          <h3 className="font-bold text-green-800 text-sm mb-2">💡 Wholesale pricing</h3>
          <p className="text-xs text-green-700 leading-relaxed">
            Your cost ÷ (1 − target margin) = Wholesale price.<br />
            Apply this when selling to restaurants, retailers, or resellers who buy in bulk. Minimum 2 kg orders recommended.
          </p>
        </div>
        <div className="bg-orange-50 rounded-xl border border-orange-200 p-5">
          <h3 className="font-bold text-orange-800 text-sm mb-2">🏪 Farm gate / Farmers Market</h3>
          <p className="text-xs text-orange-700 leading-relaxed">
            Add ~25% on top of wholesale = Retail price.<br />
            This is what you charge at markets, farm stalls, or direct-to-consumer sales.
          </p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
        <h3 className="font-bold text-gray-800 text-sm mb-2">📋 Magic Mix — Current cost: R{DEFAULT_COST_PER_KG.toFixed(2)}/kg</h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          Hardwood pellets (70%) R8/kg + Wheat bran (30%) R12/kg + Spawn (5%) R110/kg + Grow bags R5/kg = R16.95/kg substrate.
          <br />Use <strong>Edit cost</strong> to update with your actual batch costs after each flush for accurate pricing.
        </p>
      </div>
    </div>
  )
}

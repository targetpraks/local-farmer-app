'use client'
import { useState } from 'react'
import Link from 'next/link'
import { round } from '@/lib/mushrooms/magicMix'

interface PriceRecord { id: string; costPerKg: number; suggestedWholesale: number; suggestedRetail: number; createdAt: string }
interface Batch { id: string; batchCode: string; bagCount: number; substrateKg: number; costings: { costPerKg: number }[]; priceRecords: PriceRecord[] }
interface Variety { id: string; slug: string; displayName: string; colour: string; targetMarginPct: number; batches: Batch[] }

const DEFAULT_COST_PER_KG = 65 // R/kg estimated for Magic Mix at scale
const MARGIN_DEFAULTS: Record<string, number> = { pearl: 35, blue: 35, pink: 38, golden: 40, king: 42 }

function calcPrice(costPerKg: number, marginPct: number) {
  return {
    wholesale: round(costPerKg / (1 - marginPct / 100)),
    retail: round(costPerKg / (1 - marginPct / 100) * 1.25),
  }
}

export function MushroomPricesClient({ varieties }: { varieties: Variety[] }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [manualCost, setManualCost] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  // Get the latest price for each variety (from most recent priced batch)
  const latestPrices = varieties.map(v => {
    const priced = v.batches
      .filter(b => b.priceRecords.length > 0)
      .sort((a, b) => new Date(b.priceRecords[0].createdAt).getTime() - new Date(a.priceRecords[0].createdAt).getTime())
    const latest = priced[0]?.priceRecords[0]
    const margin = MARGIN_DEFAULTS[v.slug] ?? v.targetMarginPct
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
    // In Phase 2 this will POST to /api/mushrooms/prices
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🍄 Mushroom Price List</h1>
          <p className="text-gray-500 text-sm mt-0.5">Wholesale + retail prices per variety based on Magic Mix cost</p>
        </div>
        <Link href="/mushrooms" className="text-sm text-orange-600 hover:underline font-medium">
          ← Back to Batches
        </Link>
      </div>

      {/* Price table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['Variety', 'Cost/kg (Magic Mix)', 'Target Margin', 'Wholesale / kg', 'Retail / kg', 'Effective Date', ''].map(h => (
                <th key={h} className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {latestPrices.map(v => {
              const cost = editingId === v.id
                ? parseFloat(manualCost[v.id] ?? '0')
                : (v.latestPrice?.costPerKg ?? v.defaultCost)
              const { wholesale, retail } = calcPrice(cost, v.margin)
              const effectiveDate = v.latestPrice?.createdAt
                ? new Date(v.latestPrice.createdAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })
                : '—'

              return (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: v.colour }} />
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{v.displayName}</p>
                        <p className="text-xs text-gray-400 capitalize">{v.slug} oyster</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {editingId === v.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm">R</span>
                        <input
                          type="number" min={1} step={0.5}
                          value={manualCost[v.id] ?? ''}
                          onChange={e => setManualCost(prev => ({ ...prev, [v.id]: e.target.value }))}
                          className="w-24 border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium"
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-gray-900 text-sm">R{cost.toFixed(2)}</p>
                        {saved[v.id] && <p className="text-xs text-green-600">✓ Saved</p>}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{ backgroundColor: v.colour + '33', color: '#374151' }}>
                      {v.margin}%
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <p className="font-bold text-green-700 text-lg">R{wholesale.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">excl. VAT</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="font-bold text-orange-600 text-lg">R{retail.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">farm gate / market</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm text-gray-500">{effectiveDate}</p>
                  </td>
                  <td className="px-6 py-4">
                    {editingId === v.id ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleSave(v.id)}
                          className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700">
                          Save
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-300">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => handleEdit(v.id)}
                        className="text-orange-600 hover:text-orange-700 text-sm font-medium hover:underline">
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
            This is what you charge at markets, farm stalls, or direct-to-consumer sales. Includes pick-your-own premium.
          </p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
        <h3 className="font-bold text-gray-800 text-sm mb-2">📋 Magic Mix — Current default cost: R{MAGIC_MIX_COST.toFixed(2)}/kg</h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          Hardwood pellets (70%) R8/kg + Wheat bran (30%) R12/kg + Spawn (5%) R110/kg + Grow bags R5/kg = R16.95/kg substrate.
          <br />Experienced growers targeting R65–70/kg cost should update this table with their actual batch costs after each flush.
        </p>
      </div>
    </div>
  )
}

const MAGIC_MIX_COST = 16.95

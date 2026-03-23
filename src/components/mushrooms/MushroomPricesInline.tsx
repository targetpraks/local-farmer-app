'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface PriceRecord { id: string; costPerKg: number; suggestedWholesale: number; suggestedRetail: number; createdAt: string }
interface Batch { id: string; batchCode: string; bagCount: number; priceRecords: PriceRecord[] }
interface Variety {
  id: string; slug: string; displayName: string; colour: string; targetMarginPct: number
  batches: Batch[]
}

const MAGIC_MIX_COST_PER_KG = 16.95
const MARGIN_DEFAULTS: Record<string, number> = { pearl: 35, blue: 35, pink: 38, golden: 40, king: 42 }
const STORAGE_KEY = 'lf_mushroom_margins'

function round(n: number, decimals = 2) {
  return Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

export function MushroomPricesInline({ varieties }: { varieties: Variety[] }) {
  const [margins, setMargins] = useState<Record<string, number>>({})
  const [editingMargin, setEditingMargin] = useState<string | null>(null)
  const [editMarginVal, setEditMarginVal] = useState('')
  const [hydrated, setHydrated] = useState(false)

  // Load margins from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      const parsed: Record<string, number> = saved ? JSON.parse(saved) : {}
      const initial: Record<string, number> = {}
      varieties.forEach(v => {
        initial[v.slug] = parsed[v.slug] ?? MARGIN_DEFAULTS[v.slug] ?? v.targetMarginPct ?? 35
      })
      setMargins(initial)
    } catch { /* ignore */ }
    setHydrated(true)
  }, [varieties])

  // Persist margins
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(margins))
    } catch { /* ignore */ }
  }, [margins, hydrated])

  const setMargin = useCallback((slug: string, val: number) => {
    setMargins(prev => ({ ...prev, [slug]: val }))
  }, [])

  if (!hydrated) return null

  const rows = varieties.map(v => {
    const margin = margins[v.slug] ?? MARGIN_DEFAULTS[v.slug] ?? 35
    const costPerKg = MAGIC_MIX_COST_PER_KG
    const costPerGram = costPerKg / 1000
    const wholesalePerGram = round(costPerGram / (1 - margin / 100))
    const retailPerGram = round(wholesalePerGram * 1.25)
    const wholesalePerKg = round(wholesalePerGram * 1000)
    const retailPerKg = round(retailPerGram * 1000)
    return { ...v, margin, costPerKg, costPerGram, wholesalePerGram, retailPerGram, wholesalePerKg, retailPerKg }
  })

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-base">🍄 Price List (editable margins per gram)</h2>
          <span className="text-xs text-gray-400">Magic Mix: R{MAGIC_MIX_COST_PER_KG}/kg</span>
        </div>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            {['Variety', 'Cost/kg', 'Cost/g', 'Margin', 'Wholesale/g', 'Wholesale/kg', 'Retail/g', 'Retail/kg', ''].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map(v => (
            <tr key={v.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: v.colour }} />
                  <span className="font-medium text-gray-900 text-sm">{v.displayName}</span>
                </div>
              </td>
              <td className="px-4 py-3.5 text-sm text-gray-600">R{v.costPerKg.toFixed(2)}</td>
              <td className="px-4 py-3.5 text-sm font-medium text-gray-700">R{v.costPerGram.toFixed(4)}</td>
              <td className="px-4 py-3.5">
                {editingMargin === v.slug ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number" min={1} max={90} step={1}
                      value={editMarginVal}
                      onChange={e => setEditMarginVal(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { setMargin(v.slug, parseFloat(editMarginVal) || 35); setEditingMargin(null) }
                        if (e.key === 'Escape') setEditingMargin(null)
                      }}
                      className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-sm font-medium text-right"
                      autoFocus
                    />
                    <span className="text-gray-400 text-sm">%</span>
                    <button onClick={() => { setMargin(v.slug, parseFloat(editMarginVal) || 35); setEditingMargin(null) }}
                      className="bg-green-600 text-white px-1.5 py-0.5 rounded text-xs font-bold hover:bg-green-700">✓</button>
                  </div>
                ) : (
                  <button onClick={() => { setEditingMargin(v.slug); setEditMarginVal(String(v.margin)) }}
                    className="group flex items-center gap-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ backgroundColor: v.colour + '33' }}>
                      {v.margin}%
                    </span>
                    <span className="text-gray-300 text-xs group-hover:text-orange-400">✎</span>
                  </button>
                )}
              </td>
              <td className="px-4 py-3.5 text-sm font-bold text-green-700">R{v.wholesalePerGram.toFixed(4)}</td>
              <td className="px-4 py-3.5 text-sm font-medium text-green-600">R{v.wholesalePerKg.toFixed(2)}</td>
              <td className="px-4 py-3.5 text-sm font-bold text-orange-600">R{v.retailPerGram.toFixed(4)}</td>
              <td className="px-4 py-3.5 text-sm font-medium text-orange-600">R{v.retailPerKg.toFixed(2)}</td>
              <td className="px-4 py-3.5">
                <Link href="/mushrooms/prices" className="text-xs text-orange-500 hover:text-orange-700 hover:underline">
                  Full →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

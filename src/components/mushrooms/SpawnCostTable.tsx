'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface SpawnRow {
  id: string
  slug: string
  displayName: string
  colour: string
  spawnCost: number
  costPerGram: number
}

const STORAGE_KEY = 'lf_mushroom_spawn_costs'
const MAGIC_MIX_COST_PER_KG = 16.95

function recalc(spawnCost: number): number {
  const spawnCostPerBag = spawnCost * 0.1
  const substrateCostPerBag = MAGIC_MIX_COST_PER_KG * 2
  const totalCostPerBag = substrateCostPerBag + spawnCostPerBag
  const totalGramsPerBag = 800
  return totalCostPerBag / totalGramsPerBag
}

export function SpawnCostTable({ initialData }: { initialData: SpawnRow[] }) {
  const [rows, setRows] = useState<SpawnRow[]>(initialData)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, number>
        setRows(prev => prev.map(r => ({
          ...r,
          spawnCost: parsed[r.slug] ?? r.spawnCost,
          costPerGram: recalc(parsed[r.slug] ?? r.spawnCost),
        })))
      }
    } catch { /* ignore */ }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      const toSave: Record<string, number> = {}
      rows.forEach(r => { toSave[r.slug] = r.spawnCost })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    } catch { /* ignore */ }
  }, [rows, hydrated])

  function handleEdit(row: SpawnRow) {
    setEditingId(row.id)
    setEditValue(String(row.spawnCost))
  }

  function handleSave(id: string) {
    const val = parseFloat(editValue)
    if (isNaN(val) || val <= 0) { setEditingId(null); return }
    setRows(prev => prev.map(r => r.id === id ? { ...r, spawnCost: val, costPerGram: recalc(val) } : r))
    setEditingId(null)
  }

  if (!hydrated) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Variety</th>
            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Spawn Cost/kg</th>
            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Spawn / Bag</th>
            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Impact: Cost/g</th>
            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">R1 Yield</th>
            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">R2 Yield</th>
            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total/g</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map(row => (
            <tr key={row.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: row.colour }} />
                  <span className="font-medium text-gray-900 text-sm">{row.displayName}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                {editingId === row.id ? (
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-gray-400 text-sm">R</span>
                    <input
                      type="number" min={1} step={1}
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSave(row.id)}
                      className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm font-medium text-right"
                    />
                    <button onClick={() => handleSave(row.id)}
                      className="bg-green-600 text-white px-2 py-1 rounded-lg text-xs font-bold hover:bg-green-700">
                      Save
                    </button>
                    <button onClick={() => setEditingId(null)}
                      className="bg-gray-200 text-gray-700 px-2 py-1 rounded-lg text-xs font-medium hover:bg-gray-300">
                      ✕
                    </button>
                  </div>
                ) : (
                  <button onClick={() => handleEdit(row)}
                    className="group flex items-center justify-end gap-1">
                    <span className="font-bold text-orange-600 text-sm">R{row.spawnCost}/kg</span>
                    <span className="text-gray-300 text-xs group-hover:text-orange-400">✎</span>
                  </button>
                )}
              </td>
              <td className="px-6 py-4 text-right text-sm text-gray-600">
                R{(row.spawnCost * 0.1).toFixed(2)}
              </td>
              <td className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                R{row.costPerGram.toFixed(4)}/g
              </td>
              <td className="px-6 py-4 text-right text-sm text-green-600">500g</td>
              <td className="px-6 py-4 text-right text-sm text-green-600">300g</td>
              <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">800g</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

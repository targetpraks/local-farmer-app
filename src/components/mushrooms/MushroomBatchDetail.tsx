'use client'
import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'

interface Harvest { id: string; flushNumber: number; kgHarvested: number; zohoPushed: boolean }
interface Batch {
  id: string; batchCode: string; inoculationDate: string; bagCount: number; substrateKg: number
  substrateCost: number; status: string; notes: string | null
  variety: { slug: string; displayName: string; colour: string; targetMarginPct: number }
  harvests: Harvest[]; costings: any[]; priceRecords: any[]
}

export function MushroomBatchDetail({ batch }: { batch: Batch }) {
  const [r1Kg, setR1Kg] = useState(batch.harvests.find(h => h.flushNumber === 1)?.kgHarvested ?? '')
  const [r2Kg, setR2Kg] = useState(batch.harvests.find(h => h.flushNumber === 2)?.kgHarvested ?? '')
  const [saving, setSaving] = useState<string | null>(null)
  const [pushing, setPushing] = useState<string | null>(null)

  async function logHarvest(flush: number, kg: string) {
    if (!kg || parseFloat(kg) <= 0) return
    setSaving(`flush${flush}`)
    try {
      await fetch('/api/mushrooms/harvest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId: batch.id, flushNumber: flush, kgHarvested: parseFloat(kg) }),
      })
      window.location.reload()
    } finally { setSaving(null) }
  }

  async function calcPrice() {
    setSaving('calc')
    try {
      await fetch('/api/mushrooms/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId: batch.id }),
      })
      window.location.reload()
    } finally { setSaving(null) }
  }

  async function pushToZoho(action: 'price' | 'stock') {
    setPushing(action)
    try {
      const r = await fetch('/api/mushrooms/zoho', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId: batch.id, action }),
      })
      const d = await r.json()
      if (!r.ok) alert(`Error: ${d.error}`)
      else window.location.reload()
    } finally { setPushing(null) }
  }

  const totalKg = batch.harvests.reduce((s, h) => s + h.kgHarvested, 0)
  const costing = batch.costings[0]
  const pricing = batch.priceRecords[0]

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <Link href="/mushrooms" className="hover:text-gray-900">Mushrooms</Link><span>›</span>
        <span>{batch.batchCode}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: batch.variety.colour }} />
              <h1 className="text-2xl font-bold text-gray-900">{batch.variety.displayName}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${batch.status === 'ACTIVE' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                {batch.status}
              </span>
            </div>
            <p className="font-mono text-sm text-gray-400">{batch.batchCode}</p>
            <p className="text-sm text-gray-500 mt-1">Inoculated: {format(new Date(batch.inoculationDate), 'dd MMMM yyyy')}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-orange-600">R{batch.substrateCost.toFixed(2)}</p>
            <p className="text-xs text-gray-400">Substrate cost</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Bags', value: batch.bagCount },
            { label: 'Substrate kg', value: `${batch.substrateKg} kg` },
            { label: 'Total Harvested', value: `${totalKg.toFixed(1)} kg` },
            { label: 'Cost / kg', value: costing ? `R${costing.costPerKg.toFixed(2)}` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">{label}</p><p className="font-bold text-gray-900 text-sm mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Harvest logging */}
      {batch.status === 'ACTIVE' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4">🌱 Log Harvest</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { n: 1, kg: r1Kg, setKg: setR1Kg },
              { n: 2, kg: r2Kg, setKg: setR2Kg },
            ].map(({ n, kg, setKg }) => {
              const existing = batch.harvests.find(h => h.flushNumber === n)
              return (
                <div key={n} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <p className="font-medium text-gray-900">Round {n}</p>
                    {existing && <span className="text-xs text-green-600 font-medium">✓ Logged: {existing.kgHarvested}kg</span>}
                  </div>
                  <div className="flex gap-2">
                    <input type="number" step="0.1" min="0" value={kg} onChange={e => setKg(e.target.value)}
                      placeholder="kg harvested"
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    <button onClick={() => logHarvest(n, kg)}
                      disabled={!kg || saving === `flush${n}`}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-40">
                      {saving === `flush${n}` ? '...' : 'Log'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Cost & price */}
      {batch.harvests.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">💰 Cost & Pricing</h2>
            {!costing && batch.harvests.length === 2 && (
              <button onClick={calcPrice}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600">
                {saving === 'calc' ? 'Calculating...' : 'Calculate Cost & Price'}
              </button>
            )}
          </div>

          {costing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Substrate', value: `R${costing.substrateCost.toFixed(2)}` },
                  { label: 'Labour', value: `R${costing.labourCost.toFixed(2)}` },
                  { label: 'Overhead', value: `R${costing.overhead.toFixed(2)}` },
                  { label: 'Total Cost', value: `R${costing.totalCost.toFixed(2)}`, highlight: true },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className={`rounded-lg p-3 text-center ${highlight ? 'bg-orange-100' : 'bg-gray-50'}`}>
                    <p className="text-xs text-gray-500">{label}</p><p className={`font-bold text-sm mt-0.5 ${highlight ? 'text-orange-700' : 'text-gray-900'}`}>{value}</p>
                  </div>
                ))}
              </div>
              {pricing && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Cost / kg</p><p className="font-bold text-gray-900">R{pricing.costPerKg.toFixed(2)}</p>
                  </div>
                  <div className="bg-green-100 rounded-lg p-3 text-center border-2 border-green-300">
                    <p className="text-xs text-green-700">Wholesale</p><p className="font-bold text-green-800 text-lg">R{pricing.suggestedWholesale.toFixed(2)}</p>
                  </div>
                  <div className="bg-orange-100 rounded-lg p-3 text-center border-2 border-orange-300">
                    <p className="text-xs text-orange-700">Retail</p><p className="font-bold text-orange-800 text-lg">R{pricing.suggestedRetail.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Log both harvests to calculate cost.</p>
          )}
        </div>
      )}

      {/* Zoho sync */}
      {batch.status === 'COMPLETED' && batch.variety.zohoInventoryItemId && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
          <h2 className="font-bold text-gray-900 mb-1">📡 Zoho Inventory Sync</h2>
          <p className="text-xs text-gray-500 mb-4">Push pricing and stock to Zoho → website</p>
          <div className="flex gap-3">
            <button onClick={() => pushToZoho('price')}
              disabled={pushing === 'price'}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-40">
              {pushing === 'price' ? 'Pushing...' : '💰 Push Price to Zoho'}
            </button>
            <button onClick={() => pushToZoho('stock')}
              disabled={pushing === 'stock'}
              className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-purple-700 disabled:opacity-40">
              {pushing === 'stock' ? 'Pushing...' : '📦 Push Stock to Zoho'}
            </button>
          </div>
        </div>
      )}

      {batch.notes && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-sm text-gray-600">
          <p className="font-medium text-gray-700 mb-1">Notes</p>
          <p>{batch.notes}</p>
        </div>
      )}
    </div>
  )
}

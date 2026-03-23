'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'lf_production_costs_v1'

interface CostConfig {
  labourRate: number
  electricity: number
  overhead: number
  lossRate: number
  numBags: number
  substrateKg: number
  substratePricePerKg: number
  growBagPrice: number
  labourHours: number
}

const DEFAULTS: CostConfig = {
  labourRate: 45,
  electricity: 2.5,
  overhead: 5,
  lossRate: 10,
  numBags: 10,
  substrateKg: 20,
  substratePricePerKg: 16.95,
  growBagPrice: 10,
  labourHours: 2,
}

function formatRand(n: number) {
  return `R${n.toFixed(2)}`
}

function NumberInput({
  value,
  onChange,
  prefix = '',
  suffix = '',
  min = 0,
  max,
  step = 0.01,
  className = '',
}: {
  value: number
  onChange: (v: number) => void
  prefix?: string
  suffix?: string
  min?: number
  max?: number
  step?: number
  className?: string
}) {
  return (
    <div className={`flex items-center gap-1 bg-white border border-gray-300 rounded-lg px-2 py-1 focus-within:border-orange-400 focus-within:ring-1 focus-within:ring-orange-200 ${className}`}>
      {prefix && <span className="text-gray-400 text-xs">{prefix}</span>}
      <input
        type="number"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        min={min}
        max={max}
        step={step}
        className="w-full text-right bg-transparent outline-none font-medium text-gray-900 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      {suffix && <span className="text-gray-400 text-xs">{suffix}</span>}
    </div>
  )
}

export default function MushroomProductionPage() {
  const [cfg, setCfg] = useState<CostConfig>(DEFAULTS)
  const [hydrated, setHydrated] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CostConfig>
        setCfg({ ...DEFAULTS, ...parsed })
      }
    } catch {
      // ignore
    }
    setHydrated(true)
  }, [])

  // Persist to localStorage on change
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
    } catch {
      // ignore
    }
  }, [cfg, hydrated])

  const set = useCallback(<K extends keyof CostConfig>(key: K, value: CostConfig[K]) => {
    setCfg(prev => ({ ...prev, [key]: value }))
  }, [])

  // Derived calculations
  const substrateCost = cfg.substrateKg * cfg.substratePricePerKg
  const growBagCost = cfg.numBags * cfg.growBagPrice
  const labourCost = cfg.labourHours * cfg.labourRate
  const materialsSubtotal = substrateCost + growBagCost + labourCost
  const overheadCost = (cfg.overhead / 100) * materialsSubtotal
  const totalCost = materialsSubtotal + overheadCost
  const afterLoss = cfg.lossRate > 0 ? totalCost / (1 - cfg.lossRate / 100) : totalCost

  // Yield estimates (keep fixed — biological)
  const round1Yield = cfg.numBags * 0.5
  const round2Yield = round1Yield * 0.6
  const totalYield = round1Yield + round2Yield
  const costPerKg = totalYield > 0 ? afterLoss / totalYield : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/mushrooms" className="hover:text-gray-700">Mushrooms</Link>
            <span>›</span><span>Production Costing</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">🍄 Production Costing</h1>
          <p className="text-gray-500 text-sm mt-0.5">Facility costs, labour rates, and overhead allocation</p>
        </div>
        <Link href="/mushrooms" className="text-sm text-orange-600 hover:underline font-medium">
          ← Back to Mushrooms
        </Link>
      </div>

      {/* Production cost factors */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-lg">🏭 Production Cost Factors</h2>
        </div>

        {/* Batch size inputs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <p className="text-xs text-amber-700 uppercase tracking-wider font-medium mb-1">Bags per Batch</p>
            <NumberInput
              value={cfg.numBags}
              onChange={v => set('numBags', v)}
              suffix="bags"
              step={1}
              min={1}
            />
          </div>
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <p className="text-xs text-amber-700 uppercase tracking-wider font-medium mb-1">Substrate per Bag</p>
            <NumberInput
              value={cfg.substrateKg}
              onChange={v => set('substrateKg', v)}
              suffix="kg"
              step={0.5}
              min={0.5}
            />
          </div>
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <p className="text-xs text-amber-700 uppercase tracking-wider font-medium mb-1">Labour Hours</p>
            <NumberInput
              value={cfg.labourHours}
              onChange={v => set('labourHours', v)}
              suffix="hrs"
              step={0.25}
              min={0.25}
            />
          </div>
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <p className="text-xs text-amber-700 uppercase tracking-wider font-medium mb-1">Electricity</p>
            <NumberInput
              value={cfg.electricity}
              onChange={v => set('electricity', v)}
              prefix="R"
              suffix="/kWh"
              step={0.01}
              min={0}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Labour Rate</p>
            <NumberInput
              value={cfg.labourRate}
              onChange={v => set('labourRate', v)}
              prefix="R"
              suffix="/hr"
              step={1}
              min={0}
              className="mt-1"
            />
            <p className="text-xs text-gray-400 mt-1">Standard Cape Town rate</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Electricity</p>
            <NumberInput
              value={cfg.electricity}
              onChange={v => set('electricity', v)}
              prefix="R"
              suffix="/kWh"
              step={0.01}
              min={0}
              className="mt-1"
            />
            <p className="text-xs text-gray-400 mt-1">Cape Town municipal rate</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Overhead</p>
            <NumberInput
              value={cfg.overhead}
              onChange={v => set('overhead', v)}
              suffix="%"
              step={0.5}
              min={0}
              className="mt-1"
            />
            <p className="text-xs text-gray-400 mt-1">Facility, admin, misc</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Loss Rate</p>
            <NumberInput
              value={cfg.lossRate}
              onChange={v => set('lossRate', v)}
              suffix="%"
              step={0.5}
              min={0}
              max={99}
              className="mt-1"
            />
            <p className="text-xs text-gray-400 mt-1">Contamination, spoilage (target: 5%)</p>
          </div>
        </div>

        {/* Material prices */}
        <div className="border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">💰 Material Prices</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Substrate</p>
                <p className="text-xs text-gray-400">per kg</p>
              </div>
              <NumberInput
                value={cfg.substratePricePerKg}
                onChange={v => set('substratePricePerKg', v)}
                prefix="R"
                suffix="/kg"
                step={0.05}
                min={0}
                className="w-28"
              />
            </div>
            <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Grow Bags</p>
                <p className="text-xs text-gray-400">each</p>
              </div>
              <NumberInput
                value={cfg.growBagPrice}
                onChange={v => set('growBagPrice', v)}
                prefix="R"
                suffix="ea"
                step={0.5}
                min={0}
                className="w-28"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-bold text-gray-900 text-sm mb-3">📊 Cost Breakdown ({cfg.numBags} bags)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Substrate ({cfg.substrateKg} kg × {cfg.numBags} bags)</span>
                <span className="font-medium">{formatRand(cfg.substrateKg * cfg.numBags)} kg × {formatRand(cfg.substratePricePerKg)}/kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Substrate Cost</span>
                <span className="font-medium">{formatRand(substrateCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Grow bags ({cfg.numBags} × {formatRand(cfg.growBagPrice)})</span>
                <span className="font-medium">{formatRand(growBagCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Labour ({cfg.labourHours} hrs × {formatRand(cfg.labourRate)}/hr)</span>
                <span className="font-medium">{formatRand(labourCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Overhead ({cfg.overhead}% of {formatRand(materialsSubtotal)})</span>
                <span className="font-medium">{formatRand(overheadCost)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2">
                <span className="text-gray-900">Total Cost</span>
                <span className="text-orange-600">{formatRand(totalCost)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold bg-orange-50 rounded-lg px-3 py-2 -mx-1">
                <span className="text-gray-900">After {cfg.lossRate}% Loss Adjustment</span>
                <span className="text-orange-600">{formatRand(afterLoss)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Round 1 yield (500g/bag)</span>
                <span className="font-medium text-green-600">{round1Yield.toFixed(1)} kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Round 2 yield (60% of R1)</span>
                <span className="font-medium text-green-600">{round2Yield.toFixed(1)} kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total yield (40% BE)</span>
                <span className="font-bold text-gray-900">{totalYield.toFixed(1)} kg</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2">
                <span className="text-gray-900">Cost per kg harvested</span>
                <span className="text-orange-600">{formatRand(costPerKg)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Bulk discount indicator</span>
                <span className="font-medium text-gray-500">
                  {cfg.numBags >= 50 ? '✓ 50+ bag order discount applies' : `${50 - cfg.numBags} more bags for bulk pricing`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Yield assumptions */}
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
        <h3 className="font-bold text-amber-800 text-sm mb-2">🎯 Yield Assumptions</h3>
        <ul className="text-xs text-amber-700 space-y-1">
          <li><strong>Biological Efficiency:</strong> 40% total (25% Round 1 + 60% of R1 for Round 2)</li>
          <li><strong>Substrate:</strong> 2 kg per bag, 5% spawn inoculation rate</li>
          <li><strong>Cycle time:</strong> 35–50 days (inoculation → second flush complete)</li>
          <li><strong>Experienced target:</strong> 5% loss rate, 45–50% BE achievable</li>
        </ul>
      </div>

      {/* Labour breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-bold text-gray-900 text-lg mb-4">⏱️ Labour Hours per Batch</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Inoculation</p>
            <p className="text-sm text-gray-700">0.5 hrs/batch</p>
            <p className="text-xs text-gray-400">Sterilize, cool, inoculate bags</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Incubation Monitoring</p>
            <p className="text-sm text-gray-700">0.25 hrs/batch</p>
            <p className="text-xs text-gray-400">Check temps, humidity, contamination</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Harvesting</p>
            <p className="text-sm text-gray-700">1.25 hrs/batch</p>
            <p className="text-xs text-gray-400">Two flushes, weigh, pack, log</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 font-medium">Total Labour</span>
            <span className="text-gray-900 font-bold">~2 hours per 10-bag batch</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link href="/mushrooms/costing" className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-medium text-sm text-center hover:bg-gray-50 transition-colors">
          View Spawn Costing
        </Link>
        <Link href="/mushrooms/prices" className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-xl font-medium text-sm text-center hover:shadow-lg transition-all">
          View Price List
        </Link>
      </div>
    </div>
  )
}

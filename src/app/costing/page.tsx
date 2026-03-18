'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Save, 
  DollarSign, 
  Store,
  CheckCircle2,
  AlertCircle,
  Leaf,
  Search,
  Download,
  Beaker
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'

interface MicrogreenCost {
  id: string
  name: string
  variety?: string
  seedCode: string
  seedingDensity: number
  yieldPerTray: number
  prices: {
    price1: { qty: number; unitPrice: number; costPerGram: number }
    price2: { qty: number; unitPrice: number; costPerGram: number }
    price3: { qty: number; unitPrice: number; costPerGram: number }
  }
  bestPrice: number
}

interface ProductionCostConfig {
  trayCost: number
  trayUses: number
  fabricPaperCost: number
  soilCostPerKg: number
  soilPerTrayGrams: number
  waterCostPerTray: number
  electricityCostPerTray: number
  laborCostPerTray: number
  markupPercent: number
  updatedAt?: string
}

const defaultProductionConfig: ProductionCostConfig = {
  trayCost: 50,
  trayUses: 1000,
  fabricPaperCost: 2,
  soilCostPerKg: 15,
  soilPerTrayGrams: 500,
  waterCostPerTray: 1,
  electricityCostPerTray: 2,
  laborCostPerTray: 5,
  markupPercent: 100,
}

export default function SeedCostingPage() {
  const [microgreens, setMicrogreens] = useState<MicrogreenCost[]>([])
  const [productionConfig, setProductionConfig] = useState<ProductionCostConfig>(defaultProductionConfig)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [showRecalculateWarning, setShowRecalculateWarning] = useState(false)

  useEffect(() => {
    fetchData()
    fetch('/api/production-costs')
      .then(res => res.json())
      .then(result => {
        if (result.data) {
          setProductionConfig({ ...defaultProductionConfig, ...result.data })
          const configUpdatedAt = result.data.updatedAt ? new Date(result.data.updatedAt) : null
          const savedAt = localStorage.getItem('seedCostingLastSaved')
          if (configUpdatedAt && savedAt) {
            const savedDate = new Date(savedAt)
            if (configUpdatedAt > savedDate) {
              setShowRecalculateWarning(true)
            }
          }
        }
      })
      .catch(err => console.error('Failed to load production costs:', err))
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/microgreens?limit=200')
      if (!response.ok) throw new Error('Failed to fetch microgreens')
      const result = await response.json()

      const initializedMicrogreens: MicrogreenCost[] = (result.data || []).map((m: any) => ({
        ...m,
        prices: {
          price1: { qty: 100, unitPrice: m.defaultSeedCostPerGram || 0, costPerGram: m.defaultSeedCostPerGram || 0 },
          price2: { qty: 100, unitPrice: 0, costPerGram: 0 },
          price3: { qty: 100, unitPrice: 0, costPerGram: 0 },
        },
        bestPrice: m.defaultSeedCostPerGram || 0,
      }))

      setMicrogreens(initializedMicrogreens)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const updatePrice = (microgreenId: string, field: 'price1' | 'price2' | 'price3', type: 'qty' | 'unitPrice', value: number) => {
    setMicrogreens(prev => prev.map(m => {
      if (m.id !== microgreenId) return m
      const updated = { ...m }
      const priceData = { ...updated.prices[field] }
      
      if (type === 'qty') {
        priceData.qty = value
      } else {
        priceData.unitPrice = value
      }
      
      if (priceData.qty > 0 && priceData.unitPrice > 0) {
        priceData.costPerGram = priceData.unitPrice / priceData.qty
      }
      
      updated.prices = { ...updated.prices, [field]: priceData }

      const allPrices = [
        updated.prices.price1.costPerGram,
        updated.prices.price2.costPerGram,
        updated.prices.price3.costPerGram,
      ].filter(p => p > 0)

      if (allPrices.length > 0) {
        updated.bestPrice = Math.min(...allPrices)
      }

      return updated
    }))
  }

  const calculateProductionCostPerTray = () => {
    const trayAmortized = productionConfig.trayCost / productionConfig.trayUses
    const soilCost = (productionConfig.soilCostPerKg / 1000) * productionConfig.soilPerTrayGrams
    return trayAmortized + productionConfig.fabricPaperCost + soilCost + 
           productionConfig.waterCostPerTray + productionConfig.electricityCostPerTray + 
           productionConfig.laborCostPerTray
  }

  const calculateTotalCostPerGram = (m: MicrogreenCost) => {
    const seedCostPerGram = m.bestPrice
    const productionCostPerTray = calculateProductionCostPerTray()
    const productionCostPerGram = productionCostPerTray / m.yieldPerTray
    return seedCostPerGram + productionCostPerGram
  }

  const calculateListPricePerGram = (m: MicrogreenCost) => {
    const totalCost = calculateTotalCostPerGram(m)
    return totalCost * (1 + productionConfig.markupPercent / 100)
  }

  const calculateSeedCostPerTray = (m: MicrogreenCost) => {
    return m.bestPrice * m.seedingDensity
  }

  const saveCosts = async () => {
    try {
      setIsSaving(true)
      setSuccessMessage(null)

      const savePromises = microgreens.map(async (m) => {
        if (m.bestPrice <= 0) return
        const listPricePerGram = calculateListPricePerGram(m)
        return fetch(`/api/microgreens/${m.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            defaultSeedCostPerGram: m.bestPrice,
            listPricePerGram: listPricePerGram,
          }),
        })
      })

      await Promise.all(savePromises)
      const now = new Date()
      setLastSavedAt(now)
      localStorage.setItem('seedCostingLastSaved', now.toISOString())
      setShowRecalculateWarning(false)
      setSuccessMessage('All costs saved!')
      setTimeout(() => setSuccessMessage(null), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save costs')
    } finally {
      setIsSaving(false)
    }
  }

  const recalculateAllPrices = () => {
    setMicrogreens(prev => prev.map(m => ({
      ...m,
      _recalculated: Date.now()
    })))
    setShowRecalculateWarning(false)
    setSuccessMessage('Prices recalculated')
    setTimeout(() => setSuccessMessage(null), 2000)
  }

  const exportToCSV = () => {
    const headers = ['Microgreen', 'Variety', 'Seed Code', 'Seeding', 'Yield', 'P1 Qty', 'P1 Unit', 'P1/g', 'P2 Qty', 'P2 Unit', 'P2/g', 'P3 Qty', 'P3 Unit', 'P3/g', 'Best R/g', 'List R/g']
    const rows = microgreens.map(m => {
      const listPricePerGram = calculateListPricePerGram(m)
      return [
        m.name,
        m.variety || '',
        m.seedCode,
        m.seedingDensity,
        m.yieldPerTray,
        m.prices.price1.qty,
        m.prices.price1.unitPrice.toFixed(2),
        m.prices.price1.costPerGram.toFixed(3),
        m.prices.price2.qty,
        m.prices.price2.unitPrice.toFixed(2),
        m.prices.price2.costPerGram.toFixed(3),
        m.prices.price3.qty,
        m.prices.price3.unitPrice.toFixed(2),
        m.prices.price3.costPerGram.toFixed(3),
        m.bestPrice.toFixed(3),
        listPricePerGram.toFixed(3),
      ].join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `seed-costs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const filteredMicrogreens = microgreens.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         m.seedCode.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesIncomplete = showOnlyIncomplete ? m.bestPrice <= 0 : true
    return matchesSearch && matchesIncomplete
  })

  const stats = {
    total: microgreens.length,
    withPrices: microgreens.filter(m => m.bestPrice > 0).length,
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  const prodCostPerTray = calculateProductionCostPerTray()

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Seed Costing</h1>
          <p className="text-xs text-gray-500">{microgreens.length} microgreens • Enter supplier prices with quantity and unit price</p>
        </div>
        <div className="flex gap-2">
          <Link href="/trade-costing" className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-xs font-medium">
            <Store className="h-3.5 w-3.5" />
            Trade Costing
          </Link>
          <button onClick={exportToCSV} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-xs font-medium">
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
          <button onClick={saveCosts} disabled={isSaving} className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:opacity-50 transition-colors text-xs font-medium">
            {isSaving ? 'Saving...' : <><Save className="h-3.5 w-3.5" /> Save All</>}
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 flex items-center gap-2 text-xs">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {error && <ErrorMessage message={error} onRetry={fetchData} />}

      {showRecalculateWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2 text-xs">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-amber-800 font-medium">Trade Costing updated</p>
            <p className="text-amber-700 mt-0.5">List prices need recalculation</p>
            <button onClick={recalculateAllPrices} className="mt-1 px-2 py-1 bg-amber-600 text-white rounded text-xs">Recalculate</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        <div className="p-3 bg-white border border-gray-200 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Total</div>
          <div className="text-xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="p-3 bg-white border border-gray-200 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">With Prices</div>
          <div className="text-xl font-bold text-blue-600">{stats.withPrices}</div>
        </div>
        <div className="p-3 bg-white border border-gray-200 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Prod Cost/Tray</div>
          <div className="text-xl font-bold text-amber-600">R{prodCostPerTray.toFixed(2)}</div>
        </div>
        <div className="p-3 bg-white border border-gray-200 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Markup</div>
          <div className="text-xl font-bold text-purple-600">{productionConfig.markupPercent}%</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="text-xs font-medium text-gray-700 mb-2">Production Cost Breakdown</div>
        <div className="grid grid-cols-6 gap-2">
          {[
            { label: 'Tray', value: (prodCostPerTray / 6).toFixed(2) },
            { label: 'Soil', value: ((productionConfig.soilCostPerKg / 1000) * productionConfig.soilPerTrayGrams).toFixed(2) },
            { label: 'Fabric', value: productionConfig.fabricPaperCost.toFixed(2) },
            { label: 'Water', value: productionConfig.waterCostPerTray.toFixed(2) },
            { label: 'Power', value: productionConfig.electricityCostPerTray.toFixed(2) },
            { label: 'Labor', value: productionConfig.laborCostPerTray.toFixed(2) },
          ].map((item, i) => (
            <div key={i} className="text-center p-2 bg-gray-50 rounded">
              <div className="text-[10px] text-gray-500">{item.label}</div>
              <div className="text-xs font-bold text-gray-900">R{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="flex gap-3 items-center mb-0">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search microgreens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={showOnlyIncomplete}
              onChange={(e) => setShowOnlyIncomplete(e.target.checked)}
              className="rounded border-gray-300 text-cyan-600"
            />
            Missing prices only
          </label>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-3 text-left text-[10px] font-bold text-gray-600 uppercase sticky left-0 bg-gray-50 z-10 w-64">Microgreen</th>
                <th className="py-2 px-2 text-center text-[10px] font-bold text-gray-600 uppercase w-16">Code</th>
                <th className="py-2 px-2 text-center text-[10px] font-bold text-gray-600 uppercase w-12">Seed</th>
                <th className="py-2 px-2 text-center text-[10px] font-bold text-gray-600 uppercase w-12">Yield</th>
                <th className="py-1 px-1 text-center text-[10px] font-bold text-blue-700 uppercase bg-blue-50/50 w-24">P1</th>
                <th className="py-1 px-1 text-center text-[10px] font-bold text-green-700 uppercase bg-green-50/50 w-24">P2</th>
                <th className="py-1 px-1 text-center text-[10px] font-bold text-purple-700 uppercase bg-purple-50/50 w-24">P3</th>
                <th className="py-2 px-2 text-center text-[10px] font-bold text-emerald-700 uppercase bg-emerald-50 w-16">Best</th>
                <th className="py-2 px-2 text-right text-[10px] font-bold text-cyan-700 uppercase w-16">List</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredMicrogreens.map((m) => {
                const listPricePerGram = calculateListPricePerGram(m)
                const hasBestPrice = m.bestPrice > 0
                const bestPriceIndex = [
                  m.prices.price1.costPerGram,
                  m.prices.price2.costPerGram,
                  m.prices.price3.costPerGram,
                ].findIndex(p => p > 0 && p === m.bestPrice)

                return (
                  <tr key={m.id} className="hover:bg-gray-50/50">
                    <td className="py-2 px-3 sticky left-0 bg-white z-10">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Leaf className="h-2.5 w-2.5 text-green-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 text-xs truncate">{m.name}</div>
                          {m.variety && <div className="text-[10px] text-gray-500 truncate">{m.variety}</div>}
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-2 px-2 text-center">
                      <span className="text-[10px] text-gray-500 font-mono truncate block max-w-[60px]">{m.seedCode}</span>
                    </td>
                    
                    <td className="py-2 px-2 text-center">
                      <span className="inline-flex items-center px-1 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800">
                        {m.seedingDensity}
                      </span>
                    </td>
                    
                    <td className="py-2 px-2 text-center">
                      <span className="inline-flex items-center px-1 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">
                        {m.yieldPerTray}
                      </span>
                    </td>
                    
                    <td className={`py-1 px-1 ${bestPriceIndex === 0 ? 'bg-blue-50' : ''}`}>
                      <div className="flex items-center gap-0.5 text-[10px] leading-none">
                        <input
                          type="number"
                          value={m.prices.price1.qty || ''}
                          onChange={(e) => updatePrice(m.id, 'price1', 'qty', parseFloat(e.target.value) || 0)}
                          placeholder="100"
                          className="w-8 px-0.5 py-0.5 text-[9px] border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        />
                        <span className="text-gray-400 text-[8px]">@</span>
                        <input
                          type="number"
                          step="0.01"
                          value={m.prices.price1.unitPrice || ''}
                          onChange={(e) => updatePrice(m.id, 'price1', 'unitPrice', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="w-9 px-0.5 py-0.5 text-[9px] border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      {m.prices.price1.costPerGram > 0 && (
                        <div className="text-[9px] mt-0.5">
                          <span className={bestPriceIndex === 0 ? 'text-blue-700 font-bold' : 'text-gray-500'}>
                            {m.prices.price1.costPerGram.toFixed(3)}
                          </span>
                        </div>
                      )}
                    </td>
                    
                    <td className={`py-1 px-1 ${bestPriceIndex === 1 ? 'bg-green-50' : ''}`}>
                      <div className="flex items-center gap-0.5 text-[10px] leading-none">
                        <input
                          type="number"
                          value={m.prices.price2.qty || ''}
                          onChange={(e) => updatePrice(m.id, 'price2', 'qty', parseFloat(e.target.value) || 0)}
                          placeholder="100"
                          className="w-8 px-0.5 py-0.5 text-[9px] border border-gray-300 rounded focus:outline-none focus:border-green-500"
                        />
                        <span className="text-gray-400 text-[8px]">@</span>
                        <input
                          type="number"
                          step="0.01"
                          value={m.prices.price2.unitPrice || ''}
                          onChange={(e) => updatePrice(m.id, 'price2', 'unitPrice', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="w-9 px-0.5 py-0.5 text-[9px] border border-gray-300 rounded focus:outline-none focus:border-green-500"
                        />
                      </div>
                      {m.prices.price2.costPerGram > 0 && (
                        <div className="text-[9px] mt-0.5">
                          <span className={bestPriceIndex === 1 ? 'text-green-700 font-bold' : 'text-gray-500'}>
                            {m.prices.price2.costPerGram.toFixed(3)}
                          </span>
                        </div>
                      )}
                    </td>
                    
                    <td className={`py-1 px-1 ${bestPriceIndex === 2 ? 'bg-purple-50' : ''}`}>
                      <div className="flex items-center gap-0.5 text-[10px] leading-none">
                        <input
                          type="number"
                          value={m.prices.price3.qty || ''}
                          onChange={(e) => updatePrice(m.id, 'price3', 'qty', parseFloat(e.target.value) || 0)}
                          placeholder="100"
                          className="w-8 px-0.5 py-0.5 text-[9px] border border-gray-300 rounded focus:outline-none focus:border-purple-500"
                        />
                        <span className="text-gray-400 text-[8px]">@</span>
                        <input
                          type="number"
                          step="0.01"
                          value={m.prices.price3.unitPrice || ''}
                          onChange={(e) => updatePrice(m.id, 'price3', 'unitPrice', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="w-9 px-0.5 py-0.5 text-[9px] border border-gray-300 rounded focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      {m.prices.price3.costPerGram > 0 && (
                        <div className="text-[9px] mt-0.5">
                          <span className={bestPriceIndex === 2 ? 'text-purple-700 font-bold' : 'text-gray-500'}>
                            {m.prices.price3.costPerGram.toFixed(3)}
                          </span>
                        </div>
                      )}
                    </td>
                    
                    <td className="py-2 px-2 text-center">
                      {hasBestPrice ? (
                        <span className="text-xs font-bold text-emerald-700">{m.bestPrice.toFixed(3)}</span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    
                    <td className="py-2 px-2 text-right">
                      {hasBestPrice ? (
                        <span className="text-xs font-medium text-cyan-700">{listPricePerGram.toFixed(3)}</span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {filteredMicrogreens.length === 0 && (
          <div className="text-center py-6 text-gray-500 text-xs">
            No microgreens match your filter
          </div>
        )}
      </div>
    </div>
  )
}
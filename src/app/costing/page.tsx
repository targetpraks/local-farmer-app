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
    price1: number
    price2: number
    price3: number
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

  useEffect(() => {
    fetchData()
    // Load production costs from API
    fetch('/api/production-costs')
      .then(res => res.json())
      .then(result => {
        if (result.data) {
          setProductionConfig({ ...defaultProductionConfig, ...result.data })
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

      // Initialize microgreen costs with empty prices
      const initializedMicrogreens: MicrogreenCost[] = (result.data || []).map((m: any) => ({
        ...m,
        prices: {
          price1: m.defaultSeedCostPerGram || 0,
          price2: 0,
          price3: 0,
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

  const updatePrice = (microgreenId: string, field: 'price1' | 'price2' | 'price3', value: number) => {
    setMicrogreens(prev => prev.map(m => {
      if (m.id !== microgreenId) return m

      const updated = { ...m }
      updated.prices = { ...updated.prices, [field]: value }

      // Recalculate best price
      const prices = [
        updated.prices.price1,
        updated.prices.price2,
        updated.prices.price3,
      ].filter(p => p > 0)

      if (prices.length > 0) {
        updated.bestPrice = Math.min(...prices)
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
      setSuccessMessage('All costs saved successfully! Seed + Production + Markup = List Price')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save costs')
    } finally {
      setIsSaving(false)
    }
  }

  const exportToCSV = () => {
    const headers = ['Microgreen', 'Variety', 'Seed Code', 'Seeding Density', 'Yield/Tray', 'Price 1', 'Price 2', 'Price 3', 'Best Price', 'Seed Cost/Tray', 'Total Cost/Gram', 'List Price/Gram']
    const rows = microgreens.map(m => {
      const seedCost = calculateSeedCostPerTray(m)
      const totalCostPerGram = calculateTotalCostPerGram(m)
      const listPricePerGram = calculateListPricePerGram(m)
      
      return [
        m.name,
        m.variety || '',
        m.seedCode,
        m.seedingDensity,
        m.yieldPerTray,
        m.prices.price1 || '',
        m.prices.price2 || '',
        m.prices.price3 || '',
        m.bestPrice.toFixed(2),
        seedCost.toFixed(2),
        totalCostPerGram.toFixed(4),
        listPricePerGram.toFixed(4),
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Beaker className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Seed Costing</h1>
              <p className="text-cyan-100 mt-1">Enter seed prices • {microgreens.length} microgreens</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Link href="/trade-costing"
              className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
            >
              <Store className="h-4 w-4" />
              Trade Costing
            </Link>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <button
              onClick={saveCosts}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-white text-cyan-600 rounded-lg text-sm font-medium hover:bg-cyan-50 disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Saving...' : (
                <>
                  <Save className="h-4 w-4" />
                  Save All
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <p className="text-green-800 font-medium">{successMessage}</p>
        </div>
      )}

      {error && <ErrorMessage message={error} onRetry={fetchData} />}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="Total Microgreens" 
          value={stats.total.toString()} 
          icon={<Leaf className="h-5 w-5 text-green-500" />}
          color="bg-green-50 border-green-200"
        />
        <StatCard 
          title="With Prices Set" 
          value={stats.withPrices.toString()} 
          icon={<CheckCircle2 className="h-5 w-5 text-blue-500" />}
          color="bg-blue-50 border-blue-200"
        />
        <StatCard 
          title="Production Cost" 
          value={`R${calculateProductionCostPerTray().toFixed(2)}/tray`}
          icon={<Store className="h-5 w-5 text-amber-500" />}
          color="bg-amber-50 border-amber-200"
        />
        <StatCard 
          title="Markup Rate" 
          value={`${productionConfig.markupPercent}%`}
          icon={<DollarSign className="h-5 w-5 text-purple-500" />}
          color="bg-purple-50 border-purple-200"
        />
      </div>

      {/* Production Cost Breakdown */}
      <Card title="Production Cost Breakdown" subtitle="Facility costs per tray (from Trade Costing)">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Tray</p>
            <p className="font-bold text-gray-900">R{(productionConfig.trayCost / productionConfig.trayUses).toFixed(2)}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Soil</p>
            <p className="font-bold text-gray-900">R{((productionConfig.soilCostPerKg / 1000) * productionConfig.soilPerTrayGrams).toFixed(2)}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Fabric</p>
            <p className="font-bold text-gray-900">R{productionConfig.fabricPaperCost.toFixed(2)}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Water</p>
            <p className="font-bold text-gray-900">R{productionConfig.waterCostPerTray.toFixed(2)}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Electricity</p>
            <p className="font-bold text-gray-900">R{productionConfig.electricityCostPerTray.toFixed(2)}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Labor</p>
            <p className="font-bold text-gray-900">R{productionConfig.laborCostPerTray.toFixed(2)}</p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
          <div className="flex justify-between items-center">
            <span className="font-medium text-indigo-900">Total Production Cost per Tray</span>
            <span className="text-2xl font-bold text-indigo-700">R{calculateProductionCostPerTray().toFixed(2)}</span>
          </div>
          <p className="text-sm text-indigo-600 mt-1">
            This cost is distributed across all microgreens based on yield per tray
          </p>
        </div>
      </Card>

      {/* Filters */}
      <Card title="Filters">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search microgreens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
            />
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyIncomplete}
              onChange={(e) => setShowOnlyIncomplete(e.target.checked)}
              className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
            />
            <span className="text-sm text-gray-700">Show only incomplete</span>
          </label>
        </div>
      </Card>

      {/* Prices Table */}
      <Card 
        title="Seed Price Comparison" 
        subtitle={`Enter up to 3 seed prices per microgreen. Best price auto-selected.`}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase sticky left-0 bg-gray-50 z-10">Microgreen</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Seed Code</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Seeding</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Yield</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase bg-blue-50">Price 1</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase bg-green-50">Price 2</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase bg-purple-50">Price 3</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase bg-emerald-600">Best Price</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">List Price/Gram</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMicrogreens.map((m) => {
                const listPricePerGram = calculateListPricePerGram(m)
                const hasBestPrice = m.bestPrice > 0

                return (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 sticky left-0 bg-white z-10">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                          <Leaf className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{m.name}</div>
                          {m.variety && <div className="text-xs text-gray-500">{m.variety}</div>}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{m.seedCode}</td>
                    
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        {m.seedingDensity}g
                      </span>
                    </td>
                    
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {m.yieldPerTray}g
                      </span>
                    </td>
                    
                    {/* Price 1 */}
                    <td className="px-2 py-3 bg-blue-50/50">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">R</span>
                        <input
                          type="number"
                          step="0.01"
                          value={m.prices.price1 || ''}
                          onChange={(e) => updatePrice(m.id, 'price1', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="w-20 text-sm border border-gray-200 rounded px-2 py-1"
                        />
                        <span className="text-xs text-gray-500">/g</span>
                      </div>
                    </td>
                    
                    {/* Price 2 */}
                    <td className="px-2 py-3 bg-green-50/50">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">R</span>
                        <input
                          type="number"
                          step="0.01"
                          value={m.prices.price2 || ''}
                          onChange={(e) => updatePrice(m.id, 'price2', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="w-20 text-sm border border-gray-200 rounded px-2 py-1"
                        />
                        <span className="text-xs text-gray-500">/g</span>
                      </div>
                    </td>
                    
                    {/* Price 3 */}
                    <td className="px-2 py-3 bg-purple-50/50">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">R</span>
                        <input
                          type="number"
                          step="0.01"
                          value={m.prices.price3 || ''}
                          onChange={(e) => updatePrice(m.id, 'price3', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="w-20 text-sm border border-gray-200 rounded px-2 py-1"
                        />
                        <span className="text-xs text-gray-500">/g</span>
                      </div>
                    </td>
                    
                    {/* Best Price */}
                    <td className="px-4 py-3 text-center bg-emerald-50">
                      {hasBestPrice ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="text-lg font-bold text-emerald-700">R{m.bestPrice.toFixed(2)}</span>
                          <span className="text-xs text-emerald-600">per gram</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">No prices</span>
                      )}
                    </td>
                    
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold text-cyan-700">
                        {hasBestPrice ? `R${listPricePerGram.toFixed(4)}` : '-'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {filteredMicrogreens.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No microgreens found matching your search.</p>
          </div>
        )}
      </Card>
    </div>
  )
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className={`p-4 rounded-xl border shadow-sm ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-600">{title}</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
        </div>
        <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
      </div>
    </div>
  )
}

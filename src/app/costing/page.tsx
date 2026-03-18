'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  TrendingUp, 
  Save, 
  Calculator, 
  Package, 
  DollarSign, 
  Store,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Leaf,
  Search,
  Filter,
  Download
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { Tooltip } from '@/components/Tooltip'

interface Supplier {
  id: string
  name: string
}

interface MicrogreenCost {
  id: string
  name: string
  variety?: string
  seedCode: string
  seedingDensity: number
  yieldPerTray: number
  currentSeedCost: number
  supplierPrices: {
    supplier1: { supplierId: string; price: number }
    supplier2: { supplierId: string; price: number }
    supplier3: { supplierId: string; price: number }
  }
  bestPrice: number
  bestSupplierId: string | null
}

interface CostConfig {
  trayCost: number
  trayUses: number
  fabricPaperCost: number
  soilCostPerKg: number
  soilPerTrayGrams: number
  waterCostPerTray: number
  electricityCostPerTray: number
  laborCostPerTray: number
  markupPercent: number
  // Tray dimensions
  trayLengthCm: number
  trayWidthCm: number
  trayDepthCm: number
}

const defaultCostConfig: CostConfig = {
  trayCost: 50,
  trayUses: 1000,
  fabricPaperCost: 2,
  soilCostPerKg: 15,
  soilPerTrayGrams: 500,
  waterCostPerTray: 1,
  electricityCostPerTray: 2,
  laborCostPerTray: 5,
  markupPercent: 100,
  // Tray dimensions: 42cm x 22cm x 2cm
  trayLengthCm: 42,
  trayWidthCm: 22,
  trayDepthCm: 2,
}

export default function CostingPage() {
  const [microgreens, setMicrogreens] = useState<MicrogreenCost[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [costConfig, setCostConfig] = useState<CostConfig>(defaultCostConfig)
  const [searchQuery, setSearchQuery] = useState('')
  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(false)

  useEffect(() => {
    fetchData()
    const savedConfig = localStorage.getItem('costConfig')
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        setCostConfig({ ...defaultCostConfig, ...parsed })
      } catch (e) {
        console.error('Failed to load saved config:', e)
      }
    }
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [microgreensRes, suppliersRes] = await Promise.all([
        fetch('/api/microgreens?limit=200'),
        fetch('/api/suppliers'),
      ])

      if (!microgreensRes.ok) throw new Error('Failed to fetch microgreens')
      if (!suppliersRes.ok) throw new Error('Failed to fetch suppliers')

      const [microgreensData, suppliersData] = await Promise.all([
        microgreensRes.json(),
        suppliersRes.json(),
      ])

      // Initialize microgreen costs with empty supplier prices
      const initializedMicrogreens: MicrogreenCost[] = (microgreensData.data || []).map((m: any) => ({
        ...m,
        currentSeedCost: m.defaultSeedCostPerGram || 0,
        supplierPrices: {
          supplier1: { supplierId: '', price: 0 },
          supplier2: { supplierId: '', price: 0 },
          supplier3: { supplierId: '', price: 0 },
        },
        bestPrice: m.defaultSeedCostPerGram || 0,
        bestSupplierId: null,
      }))

      setMicrogreens(initializedMicrogreens)
      setSuppliers(suppliersData.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const updateSupplierPrice = (microgreenId: string, supplierNum: 1 | 2 | 3, field: 'supplierId' | 'price', value: string | number) => {
    setMicrogreens(prev => prev.map(m => {
      if (m.id !== microgreenId) return m

      const updated = { ...m }
      const key = `supplier${supplierNum}` as const
      updated.supplierPrices = {
        ...updated.supplierPrices,
        [key]: {
          ...updated.supplierPrices[key],
          [field]: value,
        },
      }

      // Recalculate best price
      const prices = [
        updated.supplierPrices.supplier1.price,
        updated.supplierPrices.supplier2.price,
        updated.supplierPrices.supplier3.price,
      ].filter(p => p > 0)

      if (prices.length > 0) {
        updated.bestPrice = Math.min(...prices)
        // Find which supplier has the best price
        if (updated.supplierPrices.supplier1.price === updated.bestPrice) {
          updated.bestSupplierId = updated.supplierPrices.supplier1.supplierId
        } else if (updated.supplierPrices.supplier2.price === updated.bestPrice) {
          updated.bestSupplierId = updated.supplierPrices.supplier2.supplierId
        } else if (updated.supplierPrices.supplier3.price === updated.bestPrice) {
          updated.bestSupplierId = updated.supplierPrices.supplier3.supplierId
        }
      }

      return updated
    }))
  }

  const calculateCosts = (m: MicrogreenCost) => {
    const seedCost = m.bestPrice * m.seedingDensity
    const trayAmortizedCost = costConfig.trayCost / costConfig.trayUses
    const soilCost = (costConfig.soilCostPerKg / 1000) * costConfig.soilPerTrayGrams
    const totalCostPerTray = trayAmortizedCost + soilCost + costConfig.fabricPaperCost + 
                            costConfig.waterCostPerTray + costConfig.electricityCostPerTray + 
                            costConfig.laborCostPerTray + seedCost
    const costPerGram = totalCostPerTray / m.yieldPerTray
    const listPricePerGram = costPerGram * (1 + costConfig.markupPercent / 100)

    return {
      seedCost,
      trayAmortizedCost,
      soilCost,
      totalCostPerTray,
      costPerGram,
      listPricePerGram,
    }
  }

  const saveCosts = async () => {
    try {
      setIsSaving(true)
      setSuccessMessage(null)

      // Save each microgreen's best price
      const savePromises = microgreens.map(async (m) => {
        if (m.bestPrice <= 0) return

        const costs = calculateCosts(m)

        return fetch(`/api/microgreens/${m.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            defaultSeedCostPerGram: m.bestPrice,
            listPricePerGram: costs.listPricePerGram,
          }),
        })
      })

      await Promise.all(savePromises)
      setSuccessMessage('All costs saved successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save costs')
    } finally {
      setIsSaving(false)
    }
  }

  const exportToCSV = () => {
    const headers = ['Microgreen', 'Variety', 'Seed Code', 'Supplier 1', 'Price 1', 'Supplier 2', 'Price 2', 'Supplier 3', 'Price 3', 'Best Price', 'Cost/Gram', 'List Price/Gram']
    const rows = microgreens.map(m => {
      const costs = calculateCosts(m)
      const s1 = suppliers.find(s => s.id === m.supplierPrices.supplier1.supplierId)?.name || ''
      const s2 = suppliers.find(s => s.id === m.supplierPrices.supplier2.supplierId)?.name || ''
      const s3 = suppliers.find(s => s.id === m.supplierPrices.supplier3.supplierId)?.name || ''
      
      return [
        m.name,
        m.variety || '',
        m.seedCode,
        s1,
        m.supplierPrices.supplier1.price || '',
        s2,
        m.supplierPrices.supplier2.price || '',
        s3,
        m.supplierPrices.supplier3.price || '',
        m.bestPrice.toFixed(2),
        costs.costPerGram.toFixed(4),
        costs.listPricePerGram.toFixed(4),
      ].join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `microgreen-costs-${new Date().toISOString().split('T')[0]}.csv`
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
    avgBestPrice: microgreens.filter(m => m.bestPrice > 0).length > 0
      ? microgreens.filter(m => m.bestPrice > 0).reduce((sum, m) => sum + m.bestPrice, 0) / microgreens.filter(m => m.bestPrice > 0).length
      : 0,
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
              <Calculator className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Cost Calculator</h1>
              <p className="text-cyan-100 mt-1">Compare supplier prices • {microgreens.length} microgreens</p>
            </div>
          </div>
          
          <div className="flex gap-3">
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
              {isSaving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save All Costs
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
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
          title="Missing Prices" 
          value={(stats.total - stats.withPrices).toString()} 
          icon={<AlertCircle className="h-5 w-5 text-amber-500" />}
          color="bg-amber-50 border-amber-200"
        />
        <StatCard 
          title="Avg Best Price" 
          value={`R${stats.avgBestPrice.toFixed(2)}/g`}
          icon={<DollarSign className="h-5 w-5 text-cyan-500" />}
          color="bg-cyan-50 border-cyan-200"
        />
      </div>

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

      {/* Cost Configuration */}
      <Card title="Production Cost Settings" subtitle="Configure your fixed costs • Tray: 42cm × 22cm × 2cm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CostInput
            label="Tray Cost"
            value={costConfig.trayCost}
            onChange={(v) => setCostConfig({ ...costConfig, trayCost: v })}
            suffix="R"
          />
          <CostInput
            label="Tray Uses"
            value={costConfig.trayUses}
            onChange={(v) => setCostConfig({ ...costConfig, trayUses: v })}
            suffix="uses"
          />
          
          <CostInput
            label="Soil Cost"
            value={costConfig.soilCostPerKg}
            onChange={(v) => setCostConfig({ ...costConfig, soilCostPerKg: v })}
            suffix="R/kg"
          />
          
          <CostInput
            label="Markup %"
            value={costConfig.markupPercent}
            onChange={(v) => setCostConfig({ ...costConfig, markupPercent: v })}
            suffix="%"
          />
        </div>
        
        {/* Tray Dimensions Display */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">Tray Dimensions</p>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">Length</p>
              <p className="text-lg font-bold text-gray-900">{costConfig.trayLengthCm} cm</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">Width</p>
              <p className="text-lg font-bold text-gray-900">{costConfig.trayWidthCm} cm</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">Depth</p>
              <p className="text-lg font-bold text-gray-900">{costConfig.trayDepthCm} cm</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Supplier Prices Table */}
      <Card 
        title="Supplier Price Comparison" 
        subtitle={`Enter prices from up to 3 suppliers for each microgreen. Best price auto-selected.`}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase sticky left-0 bg-gray-50 z-10">Microgreen</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Seed Code</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase bg-blue-50">Supplier 1</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase bg-green-50">Supplier 2</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase bg-purple-50">Supplier 3</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase bg-emerald-600">Best Price</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Cost/Gram</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">List Price</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMicrogreens.map((m) => {
                const costs = calculateCosts(m)
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
                    
                    {/* Supplier 1 */}
                    <td className="px-2 py-3 bg-blue-50/50">
                      <div className="space-y-1">
                        <select
                          value={m.supplierPrices.supplier1.supplierId}
                          onChange={(e) => updateSupplierPrice(m.id, 1, 'supplierId', e.target.value)}
                          className="w-full text-xs border border-gray-200 rounded px-2 py-1"
                        >
                          <option value="">Select...</option>
                          {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">R</span>
                          <input
                            type="number"
                            step="0.01"
                            value={m.supplierPrices.supplier1.price || ''}
                            onChange={(e) => updateSupplierPrice(m.id, 1, 'price', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="w-20 text-sm border border-gray-200 rounded px-2 py-1"
                          />
                          <span className="text-xs text-gray-500">/g</span>
                        </div>
                      </div>
                    </td>
                    
                    {/* Supplier 2 */}
                    <td className="px-2 py-3 bg-green-50/50">
                      <div className="space-y-1">
                        <select
                          value={m.supplierPrices.supplier2.supplierId}
                          onChange={(e) => updateSupplierPrice(m.id, 2, 'supplierId', e.target.value)}
                          className="w-full text-xs border border-gray-200 rounded px-2 py-1"
                        >
                          <option value="">Select...</option>
                          {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">R</span>
                          <input
                            type="number"
                            step="0.01"
                            value={m.supplierPrices.supplier2.price || ''}
                            onChange={(e) => updateSupplierPrice(m.id, 2, 'price', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="w-20 text-sm border border-gray-200 rounded px-2 py-1"
                          />
                          <span className="text-xs text-gray-500">/g</span>
                        </div>
                      </div>
                    </td>
                    
                    {/* Supplier 3 */}
                    <td className="px-2 py-3 bg-purple-50/50">
                      <div className="space-y-1">
                        <select
                          value={m.supplierPrices.supplier3.supplierId}
                          onChange={(e) => updateSupplierPrice(m.id, 3, 'supplierId', e.target.value)}
                          className="w-full text-xs border border-gray-200 rounded px-2 py-1"
                        >
                          <option value="">Select...</option>
                          {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">R</span>
                          <input
                            type="number"
                            step="0.01"
                            value={m.supplierPrices.supplier3.price || ''}
                            onChange={(e) => updateSupplierPrice(m.id, 3, 'price', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="w-20 text-sm border border-gray-200 rounded px-2 py-1"
                          />
                          <span className="text-xs text-gray-500">/g</span>
                        </div>
                      </div>
                    </td>
                    
                    {/* Best Price */}
                    <td className="px-4 py-3 text-center bg-emerald-50">
                      {hasBestPrice ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="text-lg font-bold text-emerald-700">R{m.bestPrice.toFixed(2)}</span>
                          <span className="text-xs text-emerald-600">per gram</span>
                          {m.bestSupplierId && (
                            <span className="text-xs text-gray-500 mt-1">
                              {suppliers.find(s => s.id === m.bestSupplierId)?.name || 'Unknown'}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">No prices</span>
                      )}
                    </td>
                    
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-gray-700">
                        {hasBestPrice ? `R${costs.costPerGram.toFixed(4)}` : '-'}
                      </span>
                    </td>
                    
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold text-cyan-700">
                        {hasBestPrice ? `R${costs.listPricePerGram.toFixed(4)}` : '-'}
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

function CostInput({ label, value, onChange, suffix }: { label: string; value: number; onChange: (v: number) => void; suffix: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full pr-12 pl-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{suffix}</span>
      </div>
    </div>
  )
}

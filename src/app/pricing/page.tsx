'use client'

import { useEffect, useState } from 'react'
import { Leaf, Package, Store, Building2, UtensilsCrossed, ShoppingCart, TrendingUp, Calculator, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { Microgreen, CustomerTier } from '@/types'

// Fixed production parameters
const TRAY_USES = 1000
const SOIL_PER_TRAY_GRAMS = 500

// Pack sizes
const PACK_SIZES = [
  { name: 'Small', grams: 100, packaging: 'Polypack 155x225mm' },
  { name: 'Medium', grams: 200, packaging: 'Polypack 200x300mm' },
  { name: 'Large', grams: 500, packaging: 'Polypack 300x400mm' },
]

interface CostConfig {
  trayCost: number
  trayUses: number
  fabricPaperCost: number
  soilCostPerKg: number
  soilPerTrayGrams: number
  waterCostPerTray: number
  electricityCostPerTray: number
  laborCostPerTray: number
}

const defaultCostConfig: CostConfig = {
  trayCost: 50,
  trayUses: TRAY_USES,
  fabricPaperCost: 2,
  soilCostPerKg: 15,
  soilPerTrayGrams: SOIL_PER_TRAY_GRAMS,
  waterCostPerTray: 1,
  electricityCostPerTray: 2,
  laborCostPerTray: 5,
}

// Default margins by tier
const DEFAULT_MARGINS = {
  retail: 100,    // 100% markup
  wholesale: 60,  // 60% markup
  restaurant: 80, // 80% markup
}

export default function PricingPage() {
  const [microgreens, setMicrogreens] = useState<Microgreen[]>([])
  const [customerTiers, setCustomerTiers] = useState<CustomerTier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Toggles
  const [selectedTier, setSelectedTier] = useState<'retail' | 'wholesale' | 'restaurant'>('retail')
  const [packagingType, setPackagingType] = useState<'retail' | 'wholesale'>('retail')
  const [selectedPackSize, setSelectedPackSize] = useState(100)
  const [discountPercent, setDiscountPercent] = useState(0)
  
  // Cost config
  const [costConfig, setCostConfig] = useState<CostConfig>(defaultCostConfig)
  const [margins, setMargins] = useState(DEFAULT_MARGINS)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [microgreensRes, tiersRes] = await Promise.all([
        fetch('/api/microgreens'),
        fetch('/api/pricing/tiers'),
      ])

      if (!microgreensRes.ok) throw new Error('Failed to fetch microgreens')
      if (!tiersRes.ok) throw new Error('Failed to fetch customer tiers')

      const [microgreensData, tiersData] = await Promise.all([
        microgreensRes.json(),
        tiersRes.json(),
      ])

      setMicrogreens(microgreensData.data || [])
      setCustomerTiers(tiersData.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateCostPerTray = (microgreen: Microgreen): number => {
    const seedingDensity = microgreen.seedingDensity || 0
    const seedCostPerGram = microgreen.defaultSeedCostPerGram || 0

    const trayAmortizedCost = costConfig.trayCost / costConfig.trayUses
    const soilCost = (costConfig.soilCostPerKg / 1000) * costConfig.soilPerTrayGrams
    const fabricPaperCost = costConfig.fabricPaperCost
    const waterCost = costConfig.waterCostPerTray
    const electricityCost = costConfig.electricityCostPerTray
    const laborCost = costConfig.laborCostPerTray
    const seedCost = seedingDensity * seedCostPerGram

    return trayAmortizedCost + soilCost + fabricPaperCost + waterCost + electricityCost + laborCost + seedCost
  }

  const calculatePricePerGram = (costPerGram: number, tier: 'retail' | 'wholesale' | 'restaurant'): number => {
    const margin = margins[tier]
    const marginMultiplier = 1 + (margin / 100)
    const discountMultiplier = 1 - (discountPercent / 100)
    return costPerGram * marginMultiplier * discountMultiplier
  }

  const getPackagingCost = (): number => {
    if (packagingType === 'retail') {
      return 3 // Clamshell
    }
    if (selectedPackSize === 100) return 1.5
    if (selectedPackSize === 200) return 2
    if (selectedPackSize === 500) return 3
    return 2
  }

  const getLabelCost = (): number => {
    return 0.5 // Per pack
  }

  const calculatePackPrice = (microgreen: Microgreen): number => {
    const costPerTray = calculateCostPerTray(microgreen)
    const costPerGram = microgreen.yieldPerTray > 0 ? costPerTray / microgreen.yieldPerTray : 0
    const pricePerGram = calculatePricePerGram(costPerGram, selectedTier)
    
    const gramsPrice = pricePerGram * selectedPackSize
    const packagingCost = getPackagingCost()
    const labelCost = getLabelCost()
    
    const margin = margins[selectedTier]
    const marginMultiplier = 1 + (margin / 100)
    const packagingWithMargin = packagingCost * marginMultiplier
    const labelWithMargin = labelCost * marginMultiplier
    
    return gramsPrice + packagingWithMargin + labelWithMargin
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'retail': return <Store className="h-4 w-4" />
      case 'wholesale': return <Building2 className="h-4 w-4" />
      case 'restaurant': return <UtensilsCrossed className="h-4 w-4" />
      default: return <Store className="h-4 w-4" />
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'retail': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-400'
      case 'wholesale': return 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-400'
      case 'restaurant': return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-400'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTierDescription = (tier: string) => {
    switch (tier) {
      case 'retail': return 'Direct to consumer pricing'
      case 'wholesale': return 'Bulk order pricing for resellers'
      case 'restaurant': return 'Chef-friendly pricing for culinary partners'
      default: return ''
    }
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-yellow-300" />
          <div>
            <h1 className="text-3xl font-bold">Pricing Calculator</h1>
            <p className="text-green-100 mt-1">Set your prices with confidence. Real-time calculations for every microgreen variety.</p>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchData} />}

      {/* Controls */}
      <Card title="🎯 Pricing Controls" subtitle="Customize your pricing strategy">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Customer Tier Toggle */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <label className="block text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Store className="h-4 w-4" />
              Customer Tier
            </label>
            <div className="flex rounded-lg bg-white shadow-sm p-1 border border-blue-200">
              {(['retail', 'wholesale', 'restaurant'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`flex items-center justify-center flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                    selectedTier === tier
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {getTierIcon(tier)}
                  <span className="ml-1.5 capitalize">{tier}</span>
                </button>
              ))}
            </div>
            <div className="mt-2 text-xs text-blue-600 font-medium">
              {getTierDescription(selectedTier)}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Margin: <span className="font-bold text-blue-700">{margins[selectedTier]}%</span>
            </div>
          </div>

          {/* Packaging Type Toggle */}
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
            <label className="block text-sm font-semibold text-amber-900 mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Packaging Type
            </label>
            <div className="flex rounded-lg bg-white shadow-sm p-1 border border-amber-200">
              <button
                onClick={() => setPackagingType('retail')}
                className={`flex items-center justify-center flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                  packagingType === 'retail'
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-amber-600 hover:bg-amber-50'
                }`}
              >
                <ShoppingCart className="h-4 w-4 mr-1.5" />
                Retail
              </button>
              <button
                onClick={() => setPackagingType('wholesale')}
                className={`flex items-center justify-center flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                  packagingType === 'wholesale'
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-amber-600 hover:bg-amber-50'
                }`}
              >
                <Package className="h-4 w-4 mr-1.5" />
                Wholesale
              </button>
            </div>
            <div className="mt-2 text-xs text-amber-700">
              {packagingType === 'retail' ? '📦 Clamshell packaging' : '📦 Polypack packaging'}
            </div>
          </div>

          {/* Pack Size */}
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <label className="block text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Pack Size
            </label>
            <div className="flex rounded-lg bg-white shadow-sm p-1 border border-purple-200">
              {PACK_SIZES.map((size) => (
                <button
                  key={size.grams}
                  onClick={() => setSelectedPackSize(size.grams)}
                  className={`flex items-center justify-center flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                    selectedPackSize === size.grams
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  {size.grams}g
                </button>
              ))}
            </div>
            <div className="mt-2 text-xs text-purple-700">
              {PACK_SIZES.find(s => s.grams === selectedPackSize)?.packaging}
            </div>
          </div>

          {/* Discount */}
          <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
            <Input
              label="🎁 Discount (%)"
              type="number"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
              hint="Special offer discount"
            />
            {discountPercent > 0 && (
              <div className="mt-2 text-xs text-rose-600 font-medium">
                ✨ {discountPercent}% off applied!
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Pricing Table */}
      <Card 
        title={`💰 ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Pricing`}
        subtitle={`${selectedPackSize}g ${packagingType} packs • ${margins[selectedTier]}% margin${discountPercent > 0 ? ` • ${discountPercent}% discount` : ''}`}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Microgreen
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Seed Code
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Cost/Tray
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Cost/Gram
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Price/Gram
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase tracking-wider bg-gradient-to-r from-green-500 to-emerald-500">
                  {selectedPackSize}g Pack
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {microgreens.map((microgreen) => {
                const costPerTray = calculateCostPerTray(microgreen)
                const costPerGram = microgreen.yieldPerTray > 0 ? costPerTray / microgreen.yieldPerTray : 0
                const pricePerGram = calculatePricePerGram(costPerGram, selectedTier)
                const packPrice = calculatePackPrice(microgreen)

                return (
                  <tr key={microgreen.id} className="hover:bg-green-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mr-3">
                          <Leaf className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">
                            {microgreen.name}
                          </div>
                          {microgreen.variety && (
                            <div className="text-xs text-gray-500">{microgreen.variety}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {microgreen.seedCode}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-700">
                      R{costPerTray.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-700">
                      R{costPerGram.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-bold text-blue-600">
                      R{pricePerGram.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right bg-gradient-to-r from-green-50 to-emerald-50">
                      <span className="text-lg font-bold text-green-700">
                        R{packPrice.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="🌱 Total Varieties" 
          value={microgreens.length.toString()} 
          icon={<Leaf className="h-5 w-5 text-green-500" />}
          color="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
        />
        <StatCard 
          title="💵 Avg Cost/Tray" 
          value={`R${(microgreens.reduce((sum, m) => sum + calculateCostPerTray(m), 0) / (microgreens.length || 1)).toFixed(2)}`}
          icon={<Calculator className="h-5 w-5 text-blue-500" />}
          color="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
        />
        <StatCard 
          title={`🏷️ Avg ${selectedPackSize}g Price`}
          value={`R${(microgreens.reduce((sum, m) => sum + calculatePackPrice(m), 0) / (microgreens.length || 1)).toFixed(2)}`}
          icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
          color="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200"
        />
        <StatCard 
          title="🎯 Current Tier" 
          value={selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}
          icon={getTierIcon(selectedTier)}
          color={getTierColor(selectedTier)}
        />
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color?: string }) {
  return (
    <div className={`p-4 rounded-xl border shadow-sm ${color || 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-600">{title}</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
        </div>
        <div className="p-2 bg-white rounded-lg shadow-sm">
          {icon}
        </div>
      </div>
    </div>
  )
}

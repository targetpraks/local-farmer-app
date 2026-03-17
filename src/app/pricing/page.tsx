'use client'

import { useEffect, useState } from 'react'
import { Leaf, Package, Store, Building2, UtensilsCrossed, ShoppingCart, TrendingUp, Calculator } from 'lucide-react'
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

interface PricingCalculation {
  microgreen: Microgreen
  costPerTray: number
  costPerGram: number
  // By customer tier
  retail: { listPrice: number; finalPrice: number }
  wholesale: { listPrice: number; finalPrice: number }
  restaurant: { listPrice: number; finalPrice: number }
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
    // Load saved config first (client-side only)
    if (typeof window !== 'undefined') {
      const savedConfig = localStorage.getItem('costConfig')
      if (savedConfig) {
        try {
          const parsed = JSON.parse(savedConfig)
          setCostConfig({
            trayCost: parsed.trayCost || 50,
            trayUses: parsed.trayUses || 1000,
            fabricPaperCost: parsed.fabricPaperCost || 2,
            soilCostPerKg: parsed.soilCostPerKg || 15,
            soilPerTrayGrams: parsed.soilPerTrayGrams || 500,
            waterCostPerTray: parsed.waterCostPerTray || 1,
            electricityCostPerTray: parsed.electricityCostPerTray || 2,
            laborCostPerTray: parsed.laborCostPerTray || 5,
          })
          if (parsed.marginPercent) {
            setMargins({
              retail: parsed.marginPercent,
              wholesale: Math.round(parsed.marginPercent * 0.6),
              restaurant: Math.round(parsed.marginPercent * 0.8),
            })
          }
        } catch (e) {
          console.error('Failed to parse saved config:', e)
        }
      }
    }
    
    // Then fetch data
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
    // Packaging costs based on type
    if (packagingType === 'retail') {
      return 3 // Clamshell
    }
    // Wholesale polypacks
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
    
    // Base price for the grams
    const gramsPrice = pricePerGram * selectedPackSize
    
    // Add packaging and label costs
    const packagingCost = getPackagingCost()
    const labelCost = getLabelCost()
    
    // Apply margin to packaging too
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
      case 'retail': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'wholesale': return 'bg-green-100 text-green-800 border-green-200'
      case 'restaurant': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pricing</h1>
        <p className="text-gray-500">Calculate prices for all microgreens by customer tier and packaging</p>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchData} />}

      {/* Controls */}
      <Card title="Pricing Controls" subtitle="Select customer tier, packaging type, and pack size">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Customer Tier Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer Tier</label>
            <div className="flex rounded-lg bg-gray-100 p-1">
              {(['retail', 'wholesale', 'restaurant'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`flex items-center justify-center flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                    selectedTier === tier
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {getTierIcon(tier)}
                  <span className="ml-1.5 capitalize">{tier}</span>
                </button>
              ))}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Margin: {margins[selectedTier]}%
            </div>
          </div>

          {/* Packaging Type Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Packaging Type</label>
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => setPackagingType('retail')}
                className={`flex items-center justify-center flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                  packagingType === 'retail'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ShoppingCart className="h-4 w-4 mr-1.5" />
                Retail
              </button>
              <button
                onClick={() => setPackagingType('wholesale')}
                className={`flex items-center justify-center flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                  packagingType === 'wholesale'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Package className="h-4 w-4 mr-1.5" />
                Wholesale
              </button>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {packagingType === 'retail' ? 'Clamshell packaging' : 'Polypack packaging'}
            </div>
          </div>

          {/* Pack Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pack Size</label>
            <div className="flex rounded-lg bg-gray-100 p-1">
              {PACK_SIZES.map((size) => (
                <button
                  key={size.grams}
                  onClick={() => setSelectedPackSize(size.grams)}
                  className={`flex items-center justify-center flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                    selectedPackSize === size.grams
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {size.grams}g
                </button>
              ))}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {PACK_SIZES.find(s => s.grams === selectedPackSize)?.packaging}
            </div>
          </div>

          {/* Discount */}
          <div>
            <Input
              label="Discount (%)"
              type="number"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
              hint="Applied to all prices"
            />
          </div>
        </div>
      </Card>

      {/* Pricing Table */}
      <Card 
        title={`${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Pricing`}
        subtitle={`${selectedPackSize}g ${packagingType} packs with ${margins[selectedTier]}% margin${discountPercent > 0 ? ` and ${discountPercent}% discount` : ''}`}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Microgreen
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seed Code
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost/Tray
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost/Gram
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price/Gram
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
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
                  <tr key={microgreen.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <Leaf className="h-4 w-4 text-green-500 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {microgreen.name}
                          </div>
                          {microgreen.variety && (
                            <div className="text-xs text-gray-500">{microgreen.variety}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {microgreen.seedCode}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900">
                      R{costPerTray.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900">
                      R{costPerGram.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-blue-600">
                      R{pricePerGram.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right bg-green-50">
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
          title="Total Varieties" 
          value={microgreens.length.toString()} 
          icon={<Leaf className="h-5 w-5 text-green-500" />}
        />
        <StatCard 
          title="Avg Cost/Tray" 
          value={`R${(microgreens.reduce((sum, m) => sum + calculateCostPerTray(m), 0) / (microgreens.length || 1)).toFixed(2)}`}
          icon={<Calculator className="h-5 w-5 text-blue-500" />}
        />
        <StatCard 
          title={`Avg ${selectedPackSize}g Price`}
          value={`R${(microgreens.reduce((sum, m) => sum + calculatePackPrice(m), 0) / (microgreens.length || 1)).toFixed(2)}`}
          icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
        />
        <StatCard 
          title="Current Tier" 
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
    <div className={`p-4 rounded-lg border ${color || 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">{title}</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{value}</div>
        </div>
        {icon}
      </div>
    </div>
  )
}

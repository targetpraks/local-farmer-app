'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Leaf, Package, Store, Building2, UtensilsCrossed, ShoppingCart, TrendingUp, Calculator, Sparkles, Settings } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface ProductionConfig {
  retailClamShellCost: number
  retailInfoLabelCost: number
  retailIdLabelCost: number
  wholesalePackagingSmall: number
  wholesalePackagingMedium: number
  wholesalePackagingLarge: number
  wholesaleIdLabelCost: number
}

const DEFAULT_CONFIG: ProductionConfig = {
  retailClamShellCost: 3,
  retailInfoLabelCost: 0.5,
  retailIdLabelCost: 0.5,
  wholesalePackagingSmall: 1.5,
  wholesalePackagingMedium: 2,
  wholesalePackagingLarge: 3,
  wholesaleIdLabelCost: 0.5,
}

const SUBSTRATE_COST_PER_KG = 16.95
const MAGIC_MIX_COST_PER_KG = 16.95 // matches MAGIC_MIX_COST_PER_KG from lib/mushrooms/magicMix.ts

const MUSHROOM_PACK_SIZES = [
  { grams: 100, label: '100g' },
  { grams: 250, label: '250g' },
  { grams: 500, label: '500g' },
  { grams: 1000, label: '1kg' },
]

// Mushroom packaging costs loaded from /mushrooms/production localStorage (lf_production_costs_v1)
const MUSHROOM_DEFAULTS = { growBagPrice: 10, labourRate: 45, electricity: 2.5, overhead: 5, lossRate: 10, substrateKg: 20, substratePricePerKg: 16.95, labourHours: 2 }
function getMushroomPackagingCost(packSize: number, type: 'retail' | 'wholesale', mushroomConfig: Record<string, number> = {}): number {
  const bag = mushroomConfig['growBagPrice'] ?? MUSHROOM_DEFAULTS.growBagPrice
  if (type === 'wholesale') {
    if (packSize <= 100) return bag + 1.5
    if (packSize <= 500) return bag + 2
    return bag + 3
  }
  // retail: clam shell + info label + id label
  return bag + 3 + 0.5 + 0.5
}

const MUSHROOM_PACKAGING_LABELS: Record<number, string> = {
  100: 'Small (100g)',
  250: 'Small (250g)',
  500: 'Medium (500g)',
  1000: 'Large (1kg)',
}

interface PricingTier {
  id: string
  name: string
  code: string
  markupType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FIXED_PRICE'
  markupPercent?: number
  markupValue?: number
  minimumMargin?: number
  description?: string
  isActive: boolean
}

const DEFAULT_TIERS: PricingTier[] = [
  { id: 'retail', name: 'Retail', code: 'retail', markupType: 'PERCENTAGE', markupPercent: 0, description: 'Direct to consumer', isActive: true },
  { id: 'restaurant', name: 'Restaurant', code: 'restaurant', markupType: 'PERCENTAGE', markupPercent: -10, description: 'Food service', isActive: true },
  { id: 'wholesale', name: 'Wholesale', code: 'wholesale', markupType: 'PERCENTAGE', markupPercent: -20, description: 'Bulk pricing', isActive: true },
]

const PACK_SIZES = [
  { grams: 60, label: '60g' },
  { grams: 100, label: '100g' },
  { grams: 250, label: '250g' },
  { grams: 500, label: '500g' },
  { grams: 1000, label: '1kg' },
  { grams: 5000, label: '5kg' },
]

interface PricingData {
  baseCost: number
  markupPercent: number
  finalPrice: number
  isOverridden: boolean
}

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState<'microgreens'|'mushrooms'>('microgreens')
  const [microgreens, setMicrogreens] = useState<any[]>([])
  const [mushroomVarieties, setMushroomVarieties] = useState<any[]>([])
  const [tiers, setTiers] = useState<PricingTier[]>(DEFAULT_TIERS)
  const [config, setConfig] = useState<ProductionConfig>(DEFAULT_CONFIG)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTier, setSelectedTier] = useState('retail')
  const [packagingType, setPackagingType] = useState('retail')
  const [selectedPackSize, setSelectedPackSize] = useState(100)
  const [pricingData, setPricingData] = useState<Record<string, PricingData>>({})
  const [mushroomConfig, setMushroomConfig] = useState<Record<string, number>>({})

  // Load mushroom production costs from localStorage (same as /mushrooms/production)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('lf_production_costs_v1')
      if (raw) {
        const saved = JSON.parse(raw)
        setMushroomConfig(saved)
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    Promise.all([
      fetch('/api/pricing/tiers').then(res => res.json()),
      fetch('/api/production-costs').then(res => res.json()),
      fetch('/api/microgreens?limit=100').then(res => res.json()),
      fetch('/api/mushrooms/varieties').then(res => res.json()),
    ]).then(([tiersResult, configResult, microResult, mushroomResult]) => {
      if (tiersResult.data && tiersResult.data.length > 0) {
        const sorted = [...tiersResult.data].sort((a: PricingTier, b: PricingTier) => {
          const order = ['retail', 'restaurant', 'wholesale']
          return order.indexOf(a.code) - order.indexOf(b.code)
        })
        setTiers(sorted.filter((t: PricingTier) => t.isActive))
      }
      if (configResult.data) {
        setConfig({ ...DEFAULT_CONFIG, ...configResult.data })
      }
      setMicrogreens(microResult.data || [])
      setMushroomVarieties(mushroomResult.data || [])
      setIsLoading(false)
    }).catch(err => {
      console.error('Failed to load data:', err)
      setIsLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!selectedTier || microgreens.length === 0) return

    const currentTier = tiers.find(t => t.code === selectedTier)
    if (!currentTier?.id) return

    const ids = microgreens.map(m => m.id)
    fetch('/api/pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tierId: currentTier.id, microgreenIds: ids }),
    }).then(res => res.json())
      .then(result => {
        if (result.data) setPricingData(result.data)
      })
      .catch(err => console.error('Failed to fetch pricing:', err))
  }, [selectedTier, tiers, microgreens])

  const getCurrentTier = () => tiers.find(t => t.code === selectedTier) || tiers[0]

  const getPackagingCost = () => {
    if (packagingType === 'retail') return config.retailClamShellCost
    if (selectedPackSize <= 100) return config.wholesalePackagingSmall
    if (selectedPackSize <= 500) return config.wholesalePackagingMedium
    return config.wholesalePackagingLarge
  }

  const getLabelCost = () => {
    if (packagingType === 'retail') {
      return config.retailInfoLabelCost + config.retailIdLabelCost
    }
    return config.wholesaleIdLabelCost
  }

  const getFinalPricePerGram = (microgreenId: string, listPricePerGram: number) => {
    const serverData = pricingData[microgreenId]
    if (serverData) return serverData.finalPrice
    const tier = getCurrentTier()
    if (!tier) return 0
    const markupPct = tier.markupPercent ?? tier.markupValue ?? 0
    return listPricePerGram * (1 + markupPct / 100)
  }

  const getBaseCost = (microgreenId: string) => {
    return pricingData[microgreenId]?.baseCost ?? 0
  }

  const calculatePackPrice = (microgreen: { id: string; listPricePerGram?: number }) => {
    const listPricePerGram = microgreen.listPricePerGram || 0
    const pricePerGram = getFinalPricePerGram(microgreen.id, listPricePerGram)
    const gramsPrice = pricePerGram * selectedPackSize
    const packagingCost = getPackagingCost()
    const labelCost = getLabelCost()
    return gramsPrice + packagingCost + labelCost
  }

  const getTierIcon = (tierCode: string) => {
    switch (tierCode) {
      case 'retail': return <Store className="h-4 w-4" />
      case 'wholesale': return <Building2 className="h-4 w-4" />
      case 'restaurant': return <UtensilsCrossed className="h-4 w-4" />
      default: return <Store className="h-4 w-4" />
    }
  }

  const getTierBg = (tierCode: string, isSelected: boolean) => {
    if (!isSelected) return 'text-gray-600 hover:bg-gray-50'
    switch (tierCode) {
      case 'retail': return 'bg-blue-600 text-white shadow-md'
      case 'restaurant': return 'bg-amber-600 text-white shadow-md'
      case 'wholesale': return 'bg-purple-600 text-white shadow-md'
      default: return 'bg-gray-600 text-white'
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white shadow-lg mb-6">
          <h1 className="text-3xl font-bold">Pricing Calculator</h1>
        </div>
        <div className="text-center py-12">Loading pricing data...</div>
      </div>
    )
  }

  const currentTier = getCurrentTier()
  const withPriceCount = microgreens.filter(m => {
    const data = pricingData[m.id]
    return (data && data.finalPrice > 0) || (m.listPricePerGram && m.listPricePerGram > 0)
  }).length
  const avgPackPrice = withPriceCount > 0
    ? microgreens
        .filter(m => pricingData[m.id]?.finalPrice > 0 || (m.listPricePerGram && m.listPricePerGram > 0))
        .reduce((sum, m) => sum + calculatePackPrice(m), 0) / withPriceCount
    : 0

  return (
    <div className="space-y-6 p-6">
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-yellow-300" />
            <div>
              <h1 className="text-3xl font-bold">Pricing Calculator</h1>
              <p className="text-orange-100 mt-1">Set your prices with confidence</p>
            </div>
          </div>
          <Link href="/admin/pricing-tiers">
            <Button className="bg-white/20 hover:bg-white/30 text-white border-0">
              <Settings className="h-4 w-4 mr-2" />
              Configure Tiers
            </Button>
          </Link>
        </div>
      </div>

      {/* Product Type Tabs */}
      <div className="flex space-x-1 rounded-xl bg-gray-100 p-1">
        <button
          onClick={() => setActiveTab('microgreens')}
          className={`flex items-center justify-center flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === 'microgreens'
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Leaf className="h-4 w-4 mr-2" />
          🌱 Microgreens
        </button>
        <button
          onClick={() => setActiveTab('mushrooms')}
          className={`flex items-center justify-center flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === 'mushrooms'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          🍄 Mushroom Pricing
        </button>
      </div>

      {activeTab === 'microgreens' && (
        <>
      <Card title="Pricing Controls" subtitle="Customize your pricing">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Store className="h-4 w-4" />
              Customer Tier
              {currentTier?.markupPercent !== undefined && currentTier.markupPercent !== 0 && (
                <Badge className={`ml-2 ${currentTier.markupPercent > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {currentTier.markupPercent > 0 ? '+' : ''}{currentTier.markupPercent}%
                </Badge>
              )}
            </label>
            <div className="flex rounded-lg bg-white shadow-sm p-1 border border-gray-200">
              {tiers.filter(t => t.isActive).map((tier) => (
                <button
                  key={tier.code}
                  onClick={() => setSelectedTier(tier.code)}
                  className={`flex items-center justify-center flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${getTierBg(tier.code, selectedTier === tier.code)}`}
                >
                  {getTierIcon(tier.code)}
                  <span className="ml-1.5">{tier.name}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {(currentTier?.markupPercent ?? 0) > 0 && `+${currentTier?.markupPercent}% markup applied`}
              {(currentTier?.markupPercent ?? 0) === 0 && 'List price (no adjustment)'}
              {(currentTier?.markupPercent ?? 0) < 0 && `${currentTier?.markupPercent}% discount applied`}
            </p>
          </div>

          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
            <label className="block text-sm font-semibold text-amber-900 mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Packaging Type
            </label>
            <div className="flex rounded-lg bg-white shadow-sm p-1 border border-amber-200">
              <button
                onClick={() => setPackagingType('retail')}
                className={`flex items-center justify-center flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${packagingType === 'retail' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-600 hover:text-amber-600 hover:bg-amber-50'}`}
              >
                <ShoppingCart className="h-4 w-4 mr-1.5" />
                Retail
              </button>
              <button
                onClick={() => setPackagingType('wholesale')}
                className={`flex items-center justify-center flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${packagingType === 'wholesale' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-600 hover:text-amber-600 hover:bg-amber-50'}`}
              >
                <Package className="h-4 w-4 mr-1.5" />
                Wholesale
              </button>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Select Pack Size" subtitle="Choose your pack size">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {PACK_SIZES.map((size) => (
            <button
              key={size.grams}
              onClick={() => setSelectedPackSize(size.grams)}
              className={`p-3 rounded-xl border-2 transition-all text-center ${
                selectedPackSize === size.grams
                  ? 'bg-purple-100 border-purple-500 text-purple-700 shadow-md'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-lg font-bold">{size.label}</div>
            </button>
          ))}
        </div>
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Packaging Cost:</span>
            <span className="font-medium">R{getPackagingCost().toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Label Cost:</span>
            <span className="font-medium">R{getLabelCost().toFixed(2)}</span>
          </div>
        </div>
      </Card>

      <Card title={`${currentTier?.name || 'Retail'} Pricing`} subtitle={`${selectedPackSize}g ${packagingType} packs`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Microgreen</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Seed Code</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Base Cost/Gram</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">{currentTier?.name} Price/Gram</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase bg-green-500">{selectedPackSize}g Pack</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {microgreens.map((microgreen) => {
                const listPricePerGram = microgreen.listPricePerGram || 0
                const baseCost = getBaseCost(microgreen.id)
                const tierPricePerGram = getFinalPricePerGram(microgreen.id, listPricePerGram)
                const packPrice = calculatePackPrice(microgreen)

                return (
                  <tr key={microgreen.id} className="hover:bg-green-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center mr-3">
                          <Leaf className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{microgreen.name}</div>
                          {microgreen.variety && <div className="text-xs text-gray-500">{microgreen.variety}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{microgreen.seedCode}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {baseCost > 0 ? `R${baseCost.toFixed(4)}` : listPricePerGram > 0 ? `R${listPricePerGram.toFixed(4)}` : <span className="text-amber-600 text-xs">Not set</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-blue-600">
                      {tierPricePerGram > 0 ? `R${tierPricePerGram.toFixed(4)}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right bg-green-50">
                      <span className="text-lg font-bold text-green-700">{packPrice > 0 ? `R${packPrice.toFixed(2)}` : '-'}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {microgreens.some(m => !m.listPricePerGram) && (
          <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900">Some microgreens don&apos;t have list prices set</p>
                <p className="text-sm text-amber-700 mt-1">
                  Go to the <Link href="/costing" className="underline font-medium">Costing page</Link> to calculate costs and set list prices.
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Varieties" value={microgreens.length.toString()} icon={<Leaf className="h-5 w-5 text-green-500" />} color="bg-green-50 border-green-200" />
        <StatCard title="With List Price" value={withPriceCount.toString()} icon={<TrendingUp className="h-5 w-5 text-blue-500" />} color="bg-blue-50 border-blue-200" />
        <StatCard title={`Avg ${selectedPackSize}g Price`} value={`R${avgPackPrice.toFixed(2)}`} icon={<TrendingUp className="h-5 w-5 text-purple-500" />} color="bg-purple-50 border-purple-200" />
        <StatCard title="Current Tier" value={currentTier?.name || 'Retail'} icon={getTierIcon(selectedTier)} color="bg-blue-100 text-blue-800 border-blue-200" />
      </div>
      </>
      )}

      {activeTab === 'mushrooms' && (
        <>
          {/* Mushroom tier selector */}
          <Card title="Customer Tier" subtitle="Select pricing tier for mushrooms">
            <div className="flex rounded-lg bg-white shadow-sm p-1 border border-gray-200">
              {tiers.filter(t => t.isActive).map((tier) => (
                <button
                  key={tier.code}
                  onClick={() => setSelectedTier(tier.code)}
                  className={`flex items-center justify-center flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${getTierBg(tier.code, selectedTier === tier.code)}`}
                >
                  {getTierIcon(tier.code)}
                  <span className="ml-1.5">{tier.name}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {(currentTier?.markupPercent ?? 0) > 0 && `+${currentTier?.markupPercent}% markup applied`}
              {(currentTier?.markupPercent ?? 0) === 0 && 'List price (no adjustment)'}
              {(currentTier?.markupPercent ?? 0) < 0 && `${currentTier?.markupPercent}% discount applied`}
            </p>
          </Card>

          {/* Mushroom Packaging Type Selector */}
          <Card title="Packaging Type" subtitle="Retail includes clam shell + labels; Wholesale uses grow bag only">
            <div className="grid grid-cols-2 gap-3">
              {(['retail', 'wholesale'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setPackagingType(type)}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                    packagingType === type
                      ? type === 'retail'
                        ? 'bg-green-100 border-green-500 text-green-700'
                        : 'bg-purple-100 border-purple-500 text-purple-700'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-lg font-bold capitalize">{type}</div>
                  <div className="text-xs mt-1 opacity-75">
                    {type === 'retail'
                      ? `Clam shell + labels: R${getMushroomPackagingCost(selectedPackSize, 'retail', mushroomConfig).toFixed(2)}`
                      : `Grow bag: R${getMushroomPackagingCost(selectedPackSize, 'wholesale', mushroomConfig).toFixed(2)}`}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Mushroom pack size selector */}
          <Card title="Pack Size" subtitle="Select pack size for mushroom pricing">
            <div className="grid grid-cols-4 gap-3">
              {MUSHROOM_PACK_SIZES.map((size) => (
                <button
                  key={size.grams}
                  onClick={() => setSelectedPackSize(size.grams)}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                    selectedPackSize === size.grams
                      ? 'bg-orange-100 border-orange-500 text-orange-700 shadow-md'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-lg font-bold">{size.label}</div>
                </button>
              ))}
            </div>
            <div className="mt-4 p-3 bg-orange-50 rounded-lg text-sm text-orange-800">
              <div className="flex justify-between">
                <span>Grow Bag Cost ({MUSHROOM_PACKAGING_LABELS[selectedPackSize] || selectedPackSize + 'g'}):</span>
                <span className="font-medium">R{getMushroomPackagingCost(selectedPackSize, 'retail', mushroomConfig).toFixed(2)}</span>
              </div>
            </div>
          </Card>

          {/* Mushroom pricing table */}
          <Card title={`Mushroom ${currentTier?.name || 'Retail'} Pricing`} subtitle={`${selectedPackSize}g packs · Substrate: Magic Mix @ R${MAGIC_MIX_COST_PER_KG}/kg`}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Variety</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Cost/g</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Wholesale/g</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Restaurant/g</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Retail/g</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase bg-orange-500">{selectedPackSize}g Pack</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mushroomVarieties.map((variety) => {
                    const costPerKg = MAGIC_MIX_COST_PER_KG
                    const costPerG = costPerKg / 1000
                    const targetMargin = variety.targetMarginPct || 35
                    const wholesalePerKg = costPerKg / (1 - targetMargin / 100)
                    const wholesalePerG = wholesalePerKg / 1000
                    const restaurantPerG = wholesalePerG * 0.9
                    const retailPerG = wholesalePerG * 1.25
                    const tierPricePerG = selectedTier === 'wholesale' ? wholesalePerG
                      : selectedTier === 'restaurant' ? restaurantPerG
                      : retailPerG
                    const packPrice = (tierPricePerG * selectedPackSize) + getMushroomPackagingCost(selectedPackSize, packagingType as 'retail' | 'wholesale', mushroomConfig)
                    const bgColor = selectedTier === 'wholesale' ? 'bg-purple-50'
                      : selectedTier === 'restaurant' ? 'bg-amber-50'
                      : 'bg-green-50'

                    return (
                      <tr key={variety.id} className="hover:bg-orange-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div
                              className="h-8 w-8 rounded-full flex items-center justify-center mr-3 text-white text-xs font-bold"
                              style={{ backgroundColor: variety.colour || '#f97316' }}
                            >
                              {variety.displayName.charAt(0)}
                            </div>
                            <div className="font-bold text-gray-900">{variety.displayName}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-700">
                          R{costPerG.toFixed(4)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-purple-600">
                          R{wholesalePerG.toFixed(4)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-amber-600">
                          R{restaurantPerG.toFixed(4)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-green-600">
                          R{retailPerG.toFixed(4)}
                        </td>
                        <td className={`px-4 py-3 text-right ${bgColor}`}>
                          <span className="text-lg font-bold text-orange-700">R{packPrice.toFixed(2)}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 bg-orange-50 rounded-lg text-sm text-orange-800">
              <p className="font-medium">Pricing basis:</p>
              <p>• Substrate cost: Magic Mix @ R{MAGIC_MIX_COST_PER_KG}/kg (hardwood pellets + wheat bran + spawn + grow bag)</p>
              <p>• Margin varies by variety: {mushroomVarieties.map(v => `${v.displayName.split(' ')[0]} ${v.targetMarginPct}%`).join(', ')}</p>
              <p>• Restaurant = Wholesale × 0.90 · Retail = Wholesale × 1.25</p>
            </div>
          </Card>

          {/* Mushroom stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Total Varieties"
              value={mushroomVarieties.length.toString()}
              icon={<Sparkles className="h-5 w-5 text-orange-500" />}
              color="bg-orange-50 border-orange-200"
            />
            <StatCard
              title="Substrate Cost"
              value={`R${MAGIC_MIX_COST_PER_KG}/kg`}
              icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
              color="bg-purple-50 border-purple-200"
            />
            <StatCard
              title={`${selectedPackSize}g Pack (Retail)`}
              value={`R${((MAGIC_MIX_COST_PER_KG / 1000) * (MAGIC_MIX_COST_PER_KG / (1 - 35 / 100)) * 1.25 * selectedPackSize + getMushroomPackagingCost(selectedPackSize, 'retail', mushroomConfig)).toFixed(2)}`}
              icon={<Package className="h-5 w-5 text-green-500" />}
              color="bg-green-50 border-green-200"
            />
            <StatCard
              title="Current Tier"
              value={currentTier?.name || 'Retail'}
              icon={getTierIcon(selectedTier)}
              color="bg-blue-100 text-blue-800 border-blue-200"
            />
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) {
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
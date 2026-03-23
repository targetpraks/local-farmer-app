'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Leaf, Package, Gift, Clock, Calendar, Zap, Sparkles, Store, Building2, UtensilsCrossed } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/LoadingSpinner'

interface ProductionConfig {
  wholesalePackagingSmall: number
  wholesalePackagingMedium: number
  wholesalePackagingLarge: number
  wholesaleIdLabelCost: number
}

const DURATION_DISCOUNTS = [
  { months: 1, weeks: 4, discount: 0, label: 'Monthly', icon: Clock, color: 'bg-gray-100 text-gray-700 border-gray-200', bg: 'bg-gray-50' },
  { months: 3, weeks: 12, discount: 10, label: '3 Months', icon: Calendar, color: 'bg-blue-100 text-blue-700 border-blue-200', bg: 'bg-blue-50' },
  { months: 6, weeks: 26, discount: 15, label: '6 Months', icon: Zap, color: 'bg-purple-100 text-purple-700 border-purple-200', bg: 'bg-purple-50' },
]

const MUSHROOM_SUBSCRIPTION_PACK_SIZES = [
  { grams: 50, label: '50g' },
  { grams: 100, label: '100g' },
  { grams: 200, label: '200g' },
]

const SUBSCRIPTION_PACK_SIZES = [
  { grams: 60, label: '60g' },
  { grams: 100, label: '100g' },
  { grams: 250, label: '250g' },
  { grams: 500, label: '500g' },
  { grams: 1000, label: '1kg' },
  { grams: 5000, label: '5kg' },
]

const DEFAULT_PACK_SIZE = 100

const defaultConfig: ProductionConfig = {
  wholesalePackagingSmall: 1.5,
  wholesalePackagingMedium: 2,
  wholesalePackagingLarge: 3,
  wholesaleIdLabelCost: 0.5,
}

// Mushroom base wholesale costs per gram (from issue spec)
const MUSHROOM_BASE_PRICES: Record<string, number> = {
  pearl: 0.026,
  blue: 0.028,
  pink: 0.030,
  golden: 0.033,
  king: 0.038,
}

const MUSHROOM_COLOURS: Record<string, string> = {
  pearl: '#f5f0dc',
  blue: '#6b8e9f',
  pink: '#f4a0a0',
  golden: '#e8c44a',
  king: '#d4a86a',
}

const GROW_BAG_COST = 10

interface MushroomRow {
  slug: string
  displayName: string
  colour: string
  basePricePerG: number
}

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<'microgreens'|'mushrooms'>('microgreens')
  const [microgreens, setMicrogreens] = useState<any[]>([])
  const [config, setConfig] = useState<ProductionConfig>(defaultConfig)
  const [selectedDuration, setSelectedDuration] = useState(DURATION_DISCOUNTS[0])
  const [selectedPackSize, setSelectedPackSize] = useState(DEFAULT_PACK_SIZE)
  const [selectedTier, setSelectedTier] = useState<'retail'|'restaurant'|'wholesale'>('retail')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load microgreens and production config
    Promise.all([
      fetch('/api/microgreens?limit=100').then(res => res.json()),
      fetch('/api/production-costs').then(res => res.json()),
    ]).then(([microResult, configResult]) => {
      setMicrogreens(microResult.data || [])
      if (configResult.data) {
        setConfig({ ...defaultConfig, ...configResult.data })
      }
      setIsLoading(false)
    }).catch(err => {
      console.error('Failed to load data:', err)
      setIsLoading(false)
    })
  }, [])

  const getPackagingCost = () => {
    // Subscriptions are wholesale
    if (selectedPackSize <= 100) return config.wholesalePackagingSmall
    if (selectedPackSize <= 500) return config.wholesalePackagingMedium
    return config.wholesalePackagingLarge
  }

  const calculatePrice = (listPricePerGram: number) => {
    if (!listPricePerGram) return 0
    const basePrice = listPricePerGram * selectedPackSize
    const discountMultiplier = 1 - (selectedDuration.discount / 100)
    const packagingCost = getPackagingCost()
    const labelCost = config.wholesaleIdLabelCost
    return (basePrice * discountMultiplier) + packagingCost + labelCost
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <div className="space-y-6 p-6">
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <Gift className="h-8 w-8 text-yellow-300" />
          <div>
            <h1 className="text-3xl font-bold">Subscription Pricing</h1>
            <p className="text-orange-100 mt-1">View subscription prices with duration discounts</p>
          </div>
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
          🍄 Mushrooms
        </button>
      </div>

      {activeTab === 'microgreens' && (
        <>
          <Card title="Select Duration" subtitle="Choose commitment length">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DURATION_DISCOUNTS.map((duration) => (
                <button
                  key={duration.months}
                  onClick={() => setSelectedDuration(duration)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    selectedDuration.months === duration.months
                      ? `${duration.color} border-current shadow-md`
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center shadow-sm ${
                      selectedDuration.months === duration.months ? 'bg-white' : 'bg-gray-200'
                    }`}>
                      <duration.icon className={`h-6 w-6 ${
                        selectedDuration.months === duration.months ? 'text-current' : 'text-gray-500'
                      }`} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{duration.discount}% Off</div>
                      <div className="text-sm font-medium opacity-75">{duration.label}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Pack Size Selector */}
          <Card title="Select Pack Size" subtitle="Choose your subscription pack size">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {SUBSCRIPTION_PACK_SIZES.map((size) => (
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
                <span className="font-medium">R{config.wholesaleIdLabelCost.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          <Card title="Microgreens Pricing" subtitle={`${selectedPackSize}g packs • ${selectedDuration.discount}% discount • Packaging: R${getPackagingCost().toFixed(2)}`}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Seed Code</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase bg-purple-500">Price</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {microgreens.map((m) => {
                    const price = calculatePrice(m.listPricePerGram)
                    return (
                      <tr key={m.id} className="hover:bg-purple-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center mr-3">
                              <Leaf className="h-4 w-4 text-white" />
                            </div>
                            <div className="font-bold text-gray-900">{m.name}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 font-mono">{m.seedCode}</td>
                        <td className="px-4 py-3 text-right bg-purple-50">
                          <span className="text-lg font-bold text-purple-700">
                            {price > 0 ? `R${price.toFixed(2)}` : '-'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {microgreens.some(m => !m.listPricePerGram) && (
              <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-800">
                  Some microgreens don&apos;t have list prices.
                  <Link href="/costing" className="underline font-medium">Go to Costing page</Link> to set prices.
                </p>
              </div>
            )}
          </Card>
        </>
      )}

      {activeTab === 'mushrooms' && (
        <>
          {/* Duration selector */}
          <Card title="Select Duration" subtitle="Choose commitment length">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DURATION_DISCOUNTS.map((duration) => (
                <button
                  key={duration.months}
                  onClick={() => setSelectedDuration(duration)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    selectedDuration.months === duration.months
                      ? `${duration.color} border-current shadow-md`
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center shadow-sm ${
                      selectedDuration.months === duration.months ? 'bg-white' : 'bg-gray-200'
                    }`}>
                      <duration.icon className={`h-6 w-6 ${
                        selectedDuration.months === duration.months ? 'text-current' : 'text-gray-500'
                      }`} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{duration.discount > 0 ? `${duration.discount}% Off` : 'Standard'}</div>
                      <div className="text-sm font-medium opacity-75">{duration.label}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Tier and pack size selectors */}
          <Card title="Pack Size & Tier" subtitle="Choose size and customer tier">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pack size */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Pack Size</label>
                <div className="grid grid-cols-3 gap-3">
                  {MUSHROOM_SUBSCRIPTION_PACK_SIZES.map((size) => (
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
              </div>

              {/* Tier */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Customer Tier</label>
                <div className="space-y-2">
                  {[
                    { code: 'retail' as const, name: 'Retail', icon: Store, bgClass: 'bg-green-100 text-green-700 border-green-200', selected: selectedTier === 'retail' },
                    { code: 'restaurant' as const, name: 'Restaurant', icon: UtensilsCrossed, bgClass: 'bg-amber-100 text-amber-700 border-amber-200', selected: selectedTier === 'restaurant' },
                    { code: 'wholesale' as const, name: 'Wholesale', icon: Building2, bgClass: 'bg-purple-100 text-purple-700 border-purple-200', selected: selectedTier === 'wholesale' },
                  ].map((tier) => (
                    <button
                      key={tier.code}
                      onClick={() => setSelectedTier(tier.code)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${tier.bgClass} ${
                        tier.selected ? 'border-current shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <tier.icon className="h-5 w-5" />
                      <div className="flex-1 text-left">
                        <span className="font-bold text-sm">{tier.name}</span>
                        <span className="text-xs opacity-75 ml-2">
                          {tier.code === 'retail' ? '×1.00' : tier.code === 'restaurant' ? '×0.90' : '×0.80'}
                        </span>
                      </div>
                      <span className="text-xs font-medium">
                        {tier.code === 'retail' ? 'Full' : tier.code === 'restaurant' ? '−10%' : '−20%'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Mushroom pricing table */}
          <Card title="Mushroom Subscription Pricing" subtitle={`${selectedPackSize}g packs • ${selectedDuration.label} • Grow bag: R${GROW_BAG_COST}`}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Variety</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Base/g</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Retail</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Restaurant</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Wholesale</th>
                    <th className={`px-4 py-3 text-right text-xs font-bold text-white uppercase ${
                      selectedTier === 'retail' ? 'bg-green-500' : selectedTier === 'restaurant' ? 'bg-amber-500' : 'bg-purple-500'
                    }`}>
                      {selectedTier === 'retail' ? 'Retail' : selectedTier === 'restaurant' ? 'Restaurant' : 'Wholesale'} Price
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(MUSHROOM_BASE_PRICES).map(([slug, basePricePerG]) => {
                    const displayName = slug.charAt(0).toUpperCase() + slug.slice(1) + ' Oyster'
                    const colour = MUSHROOM_COLOURS[slug] || '#888888'
                    const retailPrice = basePricePerG
                    const restaurantPrice = retailPrice * 0.90
                    const wholesalePrice = retailPrice * 0.80
                    const durationMult = 1 - (selectedDuration.discount / 100)
                    const tierPrice = selectedTier === 'wholesale' ? wholesalePrice
                      : selectedTier === 'restaurant' ? restaurantPrice
                      : retailPrice
                    const finalPrice = (tierPrice * selectedPackSize * durationMult) + GROW_BAG_COST

                    return (
                      <tr key={slug} className="hover:bg-orange-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: colour }}
                            >
                              {displayName.charAt(0)}
                            </div>
                            <span className="font-bold text-gray-900">{displayName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-mono text-gray-600">
                          R{basePricePerG.toFixed(3)}/g
                        </td>
                        <td className={`px-4 py-3 text-right text-sm font-bold ${selectedTier === 'retail' ? 'text-green-700 bg-green-50' : 'text-green-600'}`}>
                          R{retailPrice.toFixed(3)}/g
                        </td>
                        <td className={`px-4 py-3 text-right text-sm font-bold ${selectedTier === 'restaurant' ? 'text-amber-700 bg-amber-50' : 'text-amber-600'}`}>
                          R{restaurantPrice.toFixed(3)}/g
                        </td>
                        <td className={`px-4 py-3 text-right text-sm font-bold ${selectedTier === 'wholesale' ? 'text-purple-700 bg-purple-50' : 'text-purple-600'}`}>
                          R{wholesalePrice.toFixed(3)}/g
                        </td>
                        <td className={`px-4 py-3 text-right text-lg font-bold ${
                          selectedTier === 'retail' ? 'bg-green-50 text-green-700' :
                          selectedTier === 'restaurant' ? 'bg-amber-50 text-amber-700' :
                          'bg-purple-50 text-purple-700'
                        }`}>
                          R{finalPrice.toFixed(2)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 bg-orange-50 rounded-lg text-xs text-orange-800 space-y-1">
              <p><strong>Retail:</strong> Full margin · <strong>Restaurant:</strong> Retail × 0.90 · <strong>Wholesale:</strong> Retail × 0.80</p>
              <p>Prices include grow bag cost (R{GROW_BAG_COST}) + {selectedDuration.discount > 0 ? `${selectedDuration.discount}% ${selectedDuration.label} discount applied` : 'no duration discount'}</p>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

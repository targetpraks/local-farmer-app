'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Leaf, Package, Store, Building2, UtensilsCrossed, ShoppingCart, TrendingUp, Calculator, Sparkles, Settings } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface PricingTier {
  id: string
  name: string
  code: string
  markupPercent?: number
  markupValue?: number
  description?: string
  isActive: boolean
}

const DEFAULT_TIERS: PricingTier[] = [
  { id: 'retail', name: 'Retail', code: 'retail', markupPercent: 0, description: 'Direct to consumer', isActive: true },
  { id: 'restaurant', name: 'Restaurant', code: 'restaurant', markupPercent: -10, description: 'Food service', isActive: true },
  { id: 'wholesale', name: 'Wholesale', code: 'wholesale', markupPercent: -20, description: 'Bulk pricing', isActive: true },
]

const PACK_SIZES = [
  { name: 'Small', grams: 100, packaging: 'Polypack 155x225mm' },
  { name: 'Medium', grams: 200, packaging: 'Polypack 200x300mm' },
  { name: 'Large', grams: 500, packaging: 'Polypack 300x400mm' },
]

export default function PricingPage() {
  const [microgreens, setMicrogreens] = useState<any[]>([])
  const [tiers, setTiers] = useState<PricingTier[]>(DEFAULT_TIERS)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTier, setSelectedTier] = useState('retail')
  const [packagingType, setPackagingType] = useState('retail')
  const [selectedPackSize, setSelectedPackSize] = useState(100)

  useEffect(() => {
    // Load tiers from API
    fetch('/api/pricing/tiers')
      .then(res => res.json())
      .then(result => {
        if (result.data && result.data.length > 0) {
          // Sort in order: retail, restaurant, wholesale
          const sorted = [...result.data].sort((a: PricingTier, b: PricingTier) => {
            const order = ['retail', 'restaurant', 'wholesale']
            return order.indexOf(a.code) - order.indexOf(b.code)
          })
          setTiers(sorted.filter((t: PricingTier) => t.isActive))
        }
      })
      .catch(err => console.error('Failed to load tiers:', err))

    fetch('/api/microgreens?limit=100')
      .then(res => res.json())
      .then(result => {
        setMicrogreens(result.data || [])
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [])

  const getCurrentTier = () => tiers.find(t => t.code === selectedTier) || tiers[0]

  const calculatePricePerGram = (listPricePerGram: number) => {
    if (!listPricePerGram) return 0
    const tier = getCurrentTier()
    // Use markupPercent if available, otherwise fall back to markupValue
    const markupPercent = tier?.markupPercent ?? tier?.markupValue ?? 0
    return listPricePerGram * (1 + markupPercent / 100)
  }

  const getPackagingCost = () => {
    if (packagingType === 'retail') return 3
    if (selectedPackSize === 100) return 1.5
    if (selectedPackSize === 200) return 2
    if (selectedPackSize === 500) return 3
    return 2
  }

  const getLabelCost = () => 0.5

  const calculatePackPrice = (microgreen: { listPricePerGram?: number }) => {
    const listPricePerGram = microgreen.listPricePerGram || 0
    const pricePerGram = calculatePricePerGram(listPricePerGram)
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

  const getTierColor = (tierCode: string) => {
    switch (tierCode) {
      case 'retail': return 'bg-blue-600'
      case 'restaurant': return 'bg-amber-600'
      case 'wholesale': return 'bg-purple-600'
      default: return 'bg-gray-600'
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

  return (
    <div className="space-y-6 p-6">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-yellow-300" />
            <div>
              <h1 className="text-3xl font-bold">Pricing Calculator</h1>
              <p className="text-green-100 mt-1">Set your prices with confidence</p>
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

      <Card title="Pricing Controls" subtitle="Customize your pricing">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Customer Tier - Now in order: Retail, Restaurant, Wholesale */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Store className="h-4 w-4" />
              Customer Tier
              {currentTier?.markupPercent !== undefined && currentTier.markupPercent !== 0 && (
                <Badge className={`ml-2 ${
                  currentTier.markupPercent > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {currentTier.markupPercent > 0 ? '+' : ''}{currentTier.markupPercent}%
                </Badge>
              )}
            </label>
            <div className="flex rounded-lg bg-white shadow-sm p-1 border border-gray-200">
              {tiers.filter(t => t.isActive).map((tier) => (
                <button
                  key={tier.code}
                  onClick={() => setSelectedTier(tier.code)}
                  className={`flex items-center justify-center flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                    getTierBg(tier.code, selectedTier === tier.code)
                  }`}
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
          </div>

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
          </div>
        </div>
      </Card>

      <Card 
        title={`${currentTier?.name || 'Retail'} Pricing`}
        subtitle={`${selectedPackSize}g ${packagingType} packs • ${(currentTier?.markupPercent ?? 0) > 0 ? '+' : ''}${currentTier?.markupPercent ?? 0}% adjustment`}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Microgreen</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Seed Code</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">List Price/Gram</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                  {currentTier?.name} Price/Gram
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase bg-green-500">
                  {selectedPackSize}g Pack
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {microgreens.map((microgreen) => {
                const listPricePerGram = microgreen.listPricePerGram || 0
                const tierPricePerGram = calculatePricePerGram(listPricePerGram)
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
                          {microgreen.variety && (
                            <div className="text-xs text-gray-500">{microgreen.variety}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{microgreen.seedCode}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {listPricePerGram > 0 ? `R${listPricePerGram.toFixed(4)}` : <span className="text-amber-600 text-xs">Not set</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-blue-600">
                      {tierPricePerGram > 0 ? `R${tierPricePerGram.toFixed(4)}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right bg-green-50">
                      <span className="text-lg font-bold text-green-700">
                        {packPrice > 0 ? `R${packPrice.toFixed(2)}` : '-'}
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
        <StatCard 
          title="Total Varieties" 
          value={microgreens.length.toString()} 
          icon={<Leaf className="h-5 w-5 text-green-500" />}
          color="bg-green-50 border-green-200"
        />
        <StatCard 
          title="With List Price" 
          value={microgreens.filter(m => m.listPricePerGram && m.listPricePerGram > 0).length.toString()} 
          icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
          color="bg-blue-50 border-blue-200"
        />
        <StatCard 
          title={`Avg ${selectedPackSize}g Price`}
          value={`R${(microgreens
            .filter(m => m.listPricePerGram && m.listPricePerGram > 0)
            .reduce((sum, m) => sum + calculatePackPrice(m), 0) / 
            (microgreens.filter(m => m.listPricePerGram && m.listPricePerGram > 0).length || 1)
          ).toFixed(2)}`}
          icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
          color="bg-purple-50 border-purple-200"
        />
        <StatCard 
          title="Current Tier" 
          value={currentTier?.name || 'Retail'}
          icon={getTierIcon(selectedTier)}
          color="bg-blue-100 text-blue-800 border-blue-200"
        />
      </div>
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

'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Leaf, Package, Store, Building2, UtensilsCrossed, ShoppingCart, TrendingUp, Calculator, Sparkles, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { Microgreen, CustomerTier } from '@/types'

const PACK_SIZES = [
  { name: 'Small', grams: 100, packaging: 'Polypack 155x225mm' },
  { name: 'Medium', grams: 200, packaging: 'Polypack 200x300mm' },
  { name: 'Large', grams: 500, packaging: 'Polypack 300x400mm' },
]

const DEFAULT_TIER_MARKUPS = {
  retail: 0,
  wholesale: -20,
  restaurant: -10,
}

export default function PricingPage() {
  const [microgreens, setMicrogreens] = useState<Microgreen[]>([])
  const [customerTiers, setCustomerTiers] = useState<CustomerTier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedTier, setSelectedTier] = useState<'retail' | 'wholesale' | 'restaurant'>('retail')
  const [packagingType, setPackagingType] = useState('retail')
  const [selectedPackSize, setSelectedPackSize] = useState(100)

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

  const calculatePricePerGram = (listPricePerGram: number | null | undefined) => {
    if (!listPricePerGram) return 0
    
    const tierAdjustment = DEFAULT_TIER_MARKUPS[selectedTier] / 100
    
    return listPricePerGram * (1 + tierAdjustment)
  }

  const getPackagingCost = () => {
    if (packagingType === 'retail') return 3
    if (selectedPackSize === 100) return 1.5
    if (selectedPackSize === 200) return 2
    if (selectedPackSize === 500) return 3
    return 2
  }

  const getLabelCost = () => 0.5

  const calculatePackPrice = (microgreen: Microgreen) => {
    const listPricePerGram = microgreen.listPricePerGram || 0
    const pricePerGram = calculatePricePerGram(listPricePerGram)
    
    const gramsPrice = pricePerGram * selectedPackSize
    const packagingCost = getPackagingCost()
    const labelCost = getLabelCost()
    
    return gramsPrice + packagingCost + labelCost
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
      case 'retail': return 'bg-blue-600 text-white'
      case 'wholesale': return 'bg-green-600 text-white'
      case 'restaurant': return 'bg-purple-600 text-white'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-yellow-300" />
          <div>
            <h1 className="text-3xl font-bold">Pricing Calculator</h1>
            <p className="text-green-100 mt-1">Uses list prices from costing page</p>
          </div>
        </div>
        
        <div className="flex gap-3 mt-4">
          <Link href="/costing" className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors">
            <Calculator className="h-4 w-4" />
            Update List Prices
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchData} />}

      <Card title="Pricing Controls" subtitle="Customize your pricing">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    selectedTier === tier ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {getTierIcon(tier)}
                  <span className="ml-1.5 capitalize">{tier}</span>
                </button>
              ))}
            </div>
            <div className="mt-2 text-xs text-blue-600">
              {selectedTier === 'retail' && 'List price as calculated'}
              {selectedTier === 'wholesale' && '20% discount from list'}
              {selectedTier === 'restaurant' && '10% discount from list'}
            </div>
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
                  packagingType === 'retail' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-600 hover:text-amber-600 hover:bg-amber-50'
                }`}
              >
                <ShoppingCart className="h-4 w-4 mr-1.5" />
                Retail
              </button>
              <button
                onClick={() => setPackagingType('wholesale')}
                className={`flex items-center justify-center flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                  packagingType === 'wholesale' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-600 hover:text-amber-600 hover:bg-amber-50'
                }`}
              >
                <Package className="h-4 w-4 mr-1.5" />
                Wholesale
              </button>
            </div>
            <div className="mt-2 text-xs text-amber-700">
              {packagingType === 'retail' ? 'Clamshell packaging' : 'Polypack packaging'}
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
                    selectedPackSize === size.grams ? 'bg-purple-600 text-white shadow-md' : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
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
        </div>
      </Card>

      <Card title={`${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Pricing`} subtitle={`${selectedPackSize}g ${packagingType} packs`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Microgreen</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Seed Code</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">List Price/Gram</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Tier Price/Gram</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase bg-green-500">{selectedPackSize}g Pack</th>
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
        <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
      </div>
    </div>
  )
}

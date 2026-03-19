'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Leaf, Package, Gift, Clock, Calendar, Zap, Sprout, FlaskConical } from 'lucide-react'
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
  { months: 3, weeks: 12, discount: 4, label: '3 Months', icon: Clock, color: 'bg-blue-100 text-blue-700 border-blue-200', bg: 'bg-blue-50' },
  { months: 6, weeks: 26, discount: 6, label: '6 Months', icon: Calendar, color: 'bg-purple-100 text-purple-700 border-purple-200', bg: 'bg-purple-50' },
  { months: 12, weeks: 52, discount: 10, label: '12 Months', icon: Zap, color: 'bg-amber-100 text-amber-700 border-amber-200', bg: 'bg-amber-50' },
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

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState('microgreens')
  const [microgreens, setMicrogreens] = useState<any[]>([])
  const [mixes, setMixes] = useState<any[]>([])
  const [config, setConfig] = useState<ProductionConfig>(defaultConfig)
  const [selectedDuration, setSelectedDuration] = useState(DURATION_DISCOUNTS[0])
  const [selectedPackSize, setSelectedPackSize] = useState(DEFAULT_PACK_SIZE)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load microgreens and mixes
    Promise.all([
      fetch('/api/microgreens?limit=100').then(res => res.json()),
      fetch('/api/mixes').then(res => res.json()),
      fetch('/api/production-costs').then(res => res.json()),
    ]).then(([microResult, mixesResult, configResult]) => {
      setMicrogreens(microResult.data || [])
      setMixes(mixesResult.data || [])
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
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <Gift className="h-8 w-8 text-yellow-300" />
          <div>
            <h1 className="text-3xl font-bold">Subscription Pricing</h1>
            <p className="text-purple-100 mt-1">View subscription prices with duration discounts</p>
          </div>
        </div>
      </div>

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

      <div className="flex space-x-1 rounded-xl bg-gray-100 p-1">
        <button
          onClick={() => setActiveTab('microgreens')}
          className={`flex items-center justify-center flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === 'microgreens'
              ? 'bg-white text-green-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Sprout className="h-4 w-4 mr-2" />
          Microgreens ({microgreens.length})
        </button>
        <button
          onClick={() => setActiveTab('mixes')}
          className={`flex items-center justify-center flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === 'mixes'
              ? 'bg-white text-amber-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FlaskConical className="h-4 w-4 mr-2" />
          Mixes ({mixes.length})
        </button>
      </div>

      <Card 
        title={activeTab === 'microgreens' ? 'Microgreens Pricing' : 'Mixes Pricing'}
        subtitle={`${selectedPackSize}g packs • ${selectedDuration.discount}% discount • Packaging: R${getPackagingCost().toFixed(2)}`}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Name</th>
                {activeTab === 'microgreens' && <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Seed Code</th>}
                {activeTab === 'mixes' && <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Components</th>}
                <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase bg-purple-500">Price</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeTab === 'microgreens' && microgreens.map((m) => {
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
              
              {activeTab === 'mixes' && mixes.map((mix) => {
                let totalPrice = 0
                mix.components?.forEach((comp: any) => {
                  if (comp.microgreen?.listPricePerGram) {
                    totalPrice += comp.microgreen.listPricePerGram * (comp.percentage / 100) * selectedPackSize
                  }
                })
                const finalPrice = calculatePrice(totalPrice / selectedPackSize)
                
                return (
                  <tr key={mix.id} className="hover:bg-purple-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center mr-3">
                          <FlaskConical className="h-4 w-4 text-white" />
                        </div>
                        <div className="font-bold text-gray-900">{mix.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {mix.components?.map((comp: any) => (
                          <Badge key={comp.id} className="bg-amber-100 text-amber-800">
                            {comp.microgreen?.name} ({comp.percentage}%)
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right bg-purple-50">
                      <span className="text-lg font-bold text-purple-700">
                        {finalPrice > 0 ? `R${finalPrice.toFixed(2)}` : '-'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {activeTab === 'microgreens' && microgreens.some(m => !m.listPricePerGram) && (
          <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              Some microgreens don&apos;t have list prices. 
              <Link href="/costing" className="underline font-medium">Go to Costing page</Link> to set prices.
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}

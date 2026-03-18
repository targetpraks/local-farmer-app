'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Leaf, Package, Gift, Clock, Calendar, Zap, Sprout, FlaskConical } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'

const DURATION_DISCOUNTS = [
  { months: 3, weeks: 12, discount: 4, label: '3 Months', icon: Clock, color: 'bg-blue-100 text-blue-700 border-blue-200', bg: 'bg-blue-50' },
  { months: 6, weeks: 26, discount: 6, label: '6 Months', icon: Calendar, color: 'bg-purple-100 text-purple-700 border-purple-200', bg: 'bg-purple-50' },
  { months: 12, weeks: 52, discount: 10, label: '12 Months', icon: Zap, color: 'bg-amber-100 text-amber-700 border-amber-200', bg: 'bg-amber-50' },
]

const SUBSCRIPTION_PACK_SIZE = 100

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState('microgreens')
  const [microgreens, setMicrogreens] = useState<any[]>([])
  const [mixes, setMixes] = useState<any[]>([])
  const [selectedDuration, setSelectedDuration] = useState(DURATION_DISCOUNTS[0])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [microgreensRes, mixesRes] = await Promise.all([
        fetch('/api/microgreens'),
        fetch('/api/mixes'),
      ])

      if (!microgreensRes.ok) throw new Error('Failed to fetch microgreens')
      if (!mixesRes.ok) throw new Error('Failed to fetch mixes')

      const [microgreensData, mixesData] = await Promise.all([
        microgreensRes.json(),
        mixesRes.json(),
      ])

      setMicrogreens(microgreensData.data || [])
      setMixes(mixesData.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateSubscriptionPrice = (listPricePerGram: number | null | undefined) => {
    if (!listPricePerGram) return 0
    
    const basePrice = listPricePerGram * SUBSCRIPTION_PACK_SIZE
    const discountMultiplier = 1 - (selectedDuration.discount / 100)
    const packagingCost = 2.5
    const labelCost = 0.5
    
    return (basePrice * discountMultiplier) + packagingCost + labelCost
  }

  const calculateMixPrice = (mix: any) => {
    if (!mix.components || mix.components.length === 0) return 0
    
    let totalListPrice = 0
    
    mix.components.forEach((comp: any) => {
      const microgreen = comp.microgreen
      if (microgreen && microgreen.listPricePerGram) {
        const weight = (comp.percentage / 100) * SUBSCRIPTION_PACK_SIZE
        totalListPrice += microgreen.listPricePerGram * weight
      }
    })
    
    if (totalListPrice === 0) return 0
    
    const discountMultiplier = 1 - (selectedDuration.discount / 100)
    const packagingCost = 2.5
    const labelCost = 0.5
    
    return (totalListPrice * discountMultiplier) + packagingCost + labelCost
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <Gift className="h-8 w-8 text-yellow-300" />
          <div>
            <h1 className="text-3xl font-bold">Subscription Pricing</h1>
            <p className="text-purple-100 mt-1">View subscription prices with duration discounts applied</p>
          </div>
        </div>
      </div>

      <Card title="Select Subscription Duration" subtitle="Choose commitment length for discount">
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
                  <div className="text-xs opacity-50">{duration.weeks} weeks</div>
                </div>
              </div>
            </button>
          ))}
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

      {error && <ErrorMessage message={error} onRetry={fetchData} />}

      <Card 
        title={activeTab === 'microgreens' ? 'Microgreens Subscription Pricing' : 'Mixes Subscription Pricing'}
        subtitle={`${SUBSCRIPTION_PACK_SIZE}g packs • ${selectedDuration.discount}% discount (${selectedDuration.label})`}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                  {activeTab === 'microgreens' ? 'Microgreen' : 'Mix'}
                </th>
                {activeTab === 'microgreens' && (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Seed Code</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Regular Price</th>
                  </>
                )}
                {activeTab === 'mixes' && (
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Components</th>
                )}
                <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase bg-purple-500">
                  Subscription Price
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">You Save</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeTab === 'microgreens' && microgreens.map((microgreen) => {
                const listPricePerGram = microgreen.listPricePerGram || 0
                const regularPrice = listPricePerGram * SUBSCRIPTION_PACK_SIZE + 3
                const subscriptionPrice = calculateSubscriptionPrice(listPricePerGram)
                const savings = regularPrice - subscriptionPrice

                return (
                  <tr key={microgreen.id} className="hover:bg-purple-50">
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
                    <td className="px-4 py-3 text-right text-sm text-gray-500">
                      {listPricePerGram > 0 ? `R${regularPrice.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right bg-purple-50">
                      <span className="text-lg font-bold text-purple-700">
                        {subscriptionPrice > 0 ? `R${subscriptionPrice.toFixed(2)}` : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {savings > 0 ? (
                        <Badge className="bg-green-100 text-green-800">Save R{savings.toFixed(2)}</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              
              {activeTab === 'mixes' && mixes.map((mix) => {
                const subscriptionPrice = calculateMixPrice(mix)
                
                let regularPrice = 0
                mix.components?.forEach((comp: any) => {
                  const microgreen = comp.microgreen
                  if (microgreen && microgreen.listPricePerGram) {
                    const weight = (comp.percentage / 100) * SUBSCRIPTION_PACK_SIZE
                    regularPrice += microgreen.listPricePerGram * weight
                  }
                })
                regularPrice += 3
                
                const savings = regularPrice - subscriptionPrice

                return (
                  <tr key={mix.id} className="hover:bg-purple-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center mr-3">
                          <FlaskConical className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{mix.name}</div>
                          {mix.description && <div className="text-xs text-gray-500">{mix.description}</div>}
                        </div>
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
                        {subscriptionPrice > 0 ? `R${subscriptionPrice.toFixed(2)}` : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {savings > 0 ? (
                        <Badge className="bg-green-100 text-green-800">Save R{savings.toFixed(2)}</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {activeTab === 'microgreens' && microgreens.some(m => !m.listPricePerGram) && (
          <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Subscription Duration"
          value={selectedDuration.label}
          subtitle={`${selectedDuration.discount}% discount`}
          icon={<selectedDuration.icon className="h-5 w-5 text-purple-500" />}
          color={selectedDuration.bg}
        />
        <StatCard 
          title="Pack Size"
          value={`${SUBSCRIPTION_PACK_SIZE}g`}
          subtitle="Standard subscription pack"
          icon={<Package className="h-5 w-5 text-blue-500" />}
          color="bg-blue-50"
        />
        <StatCard 
          title={activeTab === 'microgreens' ? 'Microgreens Available' : 'Mixes Available'}
          value={activeTab === 'microgreens' ? microgreens.length.toString() : mixes.length.toString()}
          subtitle="Products with subscription pricing"
          icon={activeTab === 'microgreens' ? <Leaf className="h-5 w-5 text-green-500" /> : <FlaskConical className="h-5 w-5 text-amber-500" />}
          color={activeTab === 'microgreens' ? 'bg-green-50' : 'bg-amber-50'}
        />
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle, icon, color }: { title: string; value: string; subtitle: string; icon: React.ReactNode; color: string }) {
  return (
    <div className={`p-4 rounded-xl border shadow-sm ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-600">{title}</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
          <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
        </div>
        <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
      </div>
    </div>
  )
}

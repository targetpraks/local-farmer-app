'use client'

import { useEffect, useState } from 'react'
import { Save, Store, Building2, UtensilsCrossed, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'

interface PricingTier {
  id: string
  name: string
  code: string
  markupPercent: number
  markupValue?: number
  description?: string
  isActive: boolean
}

const DEFAULT_TIERS = [
  { id: 'retail', name: 'Retail', code: 'retail', markupPercent: 0, description: 'Direct to consumer pricing', isActive: true },
  { id: 'restaurant', name: 'Restaurant', code: 'restaurant', markupPercent: -10, description: 'Restaurant and food service', isActive: true },
  { id: 'wholesale', name: 'Wholesale', code: 'wholesale', markupPercent: -20, description: 'Bulk wholesale pricing', isActive: true },
]

export default function PricingTiersPage() {
  const [tiers, setTiers] = useState<PricingTier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchTiers()
  }, [])

  const fetchTiers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/pricing/tiers')
      if (!response.ok) throw new Error('Failed to fetch pricing tiers')
      const result = await response.json()
      
      // If no tiers exist, use defaults
      if (!result.data || result.data.length === 0) {
        setTiers(DEFAULT_TIERS)
      } else {
        // Sort in order: retail, restaurant, wholesale
        const sorted = [...result.data].sort((a, b) => {
          const order = ['retail', 'restaurant', 'wholesale']
          return order.indexOf(a.code) - order.indexOf(b.code)
        })
        setTiers(sorted)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pricing tiers')
      // Fallback to defaults
      setTiers(DEFAULT_TIERS)
    } finally {
      setIsLoading(false)
    }
  }

  const updateTier = (id: string, field: keyof PricingTier, value: any) => {
    setTiers(prev => prev.map(tier => 
      tier.id === id ? { ...tier, [field]: value } : tier
    ))
  }

  const saveTiers = async () => {
    try {
      setIsSaving(true)
      setSuccessMessage(null)
      setError(null)

      // Save each tier
      const savePromises = tiers.map(async (tier) => {
        const response = await fetch(`/api/pricing/tiers/${tier.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            markupValue: tier.markupPercent,
            isActive: tier.isActive,
          }),
        })
        
        if (!response.ok) {
          // If tier doesn't exist, create it
          const createResponse = await fetch('/api/pricing/tiers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: tier.name,
              code: tier.code,
              markupPercent: tier.markupPercent,
              markupValue: tier.markupPercent,
              description: tier.description,
              isActive: tier.isActive,
            }),
          })
          
          if (!createResponse.ok) {
            throw new Error(`Failed to save ${tier.name} tier`)
          }
        }
      })

      await Promise.all(savePromises)
      
      // Also save to localStorage for quick access
      localStorage.setItem('pricingTiers', JSON.stringify(tiers))
      
      setSuccessMessage('Pricing tiers saved successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save pricing tiers')
    } finally {
      setIsSaving(false)
    }
  }

  const getTierIcon = (code: string) => {
    switch (code) {
      case 'retail': return <Store className="h-6 w-6" />
      case 'wholesale': return <Building2 className="h-6 w-6" />
      case 'restaurant': return <UtensilsCrossed className="h-6 w-6" />
      default: return <Store className="h-6 w-6" />
    }
  }

  const getTierColor = (code: string) => {
    switch (code) {
      case 'retail': return 'bg-blue-500'
      case 'restaurant': return 
        'bg-amber-500'
      case 'wholesale': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const getTierBg = (code: string) => {
    switch (code) {
      case 'retail': return 'bg-blue-50 border-blue-200'
      case 'restaurant': return 'bg-amber-50 border-amber-200'
      case 'wholesale': return 'bg-purple-50 border-purple-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <TrendingUp className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Pricing Tiers</h1>
              <p className="text-indigo-100 mt-1">Configure discount/markup for each customer tier</p>
            </div>
          </div>
          
          <Button 
            onClick={saveTiers}
            disabled={isSaving}
            className="bg-white text-indigo-600 hover:bg-indigo-50"
          >
            {isSaving ? 'Saving...' : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <p className="text-green-800 font-medium">{successMessage}</p>
        </div>
      )}

      {error && <ErrorMessage message={error} onRetry={fetchTiers} />}

      {/* Info Card */}
      <Card title="How Pricing Tiers Work" subtitle="Understanding the markup/discount system">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Markup Percentage</p>
              <p className="text-sm text-gray-600 mt-1">
                Enter a positive number to add markup, or a negative number for discount.
                For example: <strong>0%</strong> = list price, <strong>-10%</strong> = 10% discount, <strong>+20%</strong> = 20% markup.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Order Matters</p>
              <p className="text-sm text-gray-600 mt-1">
                Tiers are displayed in order: <strong>Retail → Restaurant → Wholesale</strong>.
                This order is used throughout the app for consistency.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <div 
            key={tier.id}
            className={`rounded-2xl border-2 p-6 transition-all ${
              tier.isActive ? getTierBg(tier.code) : 'bg-gray-100 border-gray-200 opacity-60'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-xl text-white ${getTierColor(tier.code)}`}>
                {getTierIcon(tier.code)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                <p className="text-sm text-gray-500">{tier.description}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Markup Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Markup / Discount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={tier.markupPercent}
                    onChange={(e) => updateTier(tier.id, 'markupPercent', parseFloat(e.target.value) || 0)}
                    className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {tier.markupPercent > 0 && `+${tier.markupPercent}% markup above list price`}
                  {tier.markupPercent === 0 && 'List price (no change)'}
                  {tier.markupPercent < 0 && `${tier.markupPercent}% discount from list price`}
                </p>
              </div>

              {/* Example Calculation */}
              <div className="bg-white/60 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Example</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">List price:</span>
                    <span className="font-medium">R1.00/g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{tier.name} price:</span>
                    <span className="font-bold text-indigo-600">
                      R{(1 * (1 + tier.markupPercent / 100)).toFixed(2)}/g
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tier.isActive}
                  onChange={(e) => updateTier(tier.id, 'isActive', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={saveTiers}
          disabled={isSaving}
          size="lg"
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {isSaving ? 'Saving...' : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Save All Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

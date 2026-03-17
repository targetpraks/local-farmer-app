'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calculator, TrendingUp, Package, DollarSign, Leaf, FlaskConical } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { EmptyState } from '@/components/EmptyState'
import { Microgreen, Mix, MicrogreenCosting, MixCosting, Supplier, SupplierPrice } from '@/types'

interface CostBreakdown {
  seedCost: number
  soilCost: number
  trayCost: number
  laborCost: number
  waterCost: number
  electricityCost: number
  packagingCost: number
  overheadCost: number
  totalCostPerTray: number
  costPerGram: number
  costPerServing?: number
}

interface CheapestSupplier {
  microgreenId: string
  supplier: Supplier
  price: number
}

export default function CostingPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'microgreen' | 'mix'>('microgreen')
  const [microgreens, setMicrogreens] = useState<Microgreen[]>([])
  const [mixes, setMixes] = useState<Mix[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [selectedMicrogreenId, setSelectedMicrogreenId] = useState('')
  const [selectedMixId, setSelectedMixId] = useState('')
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null)
  const [cheapestSuppliers, setCheapestSuppliers] = useState<CheapestSupplier[]>([])
  const [isCalculating, setIsCalculating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [microgreensRes, mixesRes, suppliersRes] = await Promise.all([
        fetch('/api/microgreens'),
        fetch('/api/mixes'),
        fetch('/api/suppliers'),
      ])

      if (!microgreensRes.ok) throw new Error('Failed to fetch microgreens')
      if (!mixesRes.ok) throw new Error('Failed to fetch mixes')
      if (!suppliersRes.ok) throw new Error('Failed to fetch suppliers')

      const [microgreensData, mixesData, suppliersData] = await Promise.all([
        microgreensRes.json(),
        mixesRes.json(),
        suppliersRes.json(),
      ])

      setMicrogreens(microgreensData.data || [])
      setMixes(mixesData.data || [])
      setSuppliers(suppliersData.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateMicrogreenCost = async () => {
    if (!selectedMicrogreenId) return

    try {
      setIsCalculating(true)
      setError(null)

      // Fetch costing data for the selected microgreen
      const response = await fetch(`/api/costing?microgreenId=${selectedMicrogreenId}&defaultOnly=true`)
      if (!response.ok) throw new Error('Failed to fetch costing data')
      
      const result = await response.json()
      const costing: MicrogreenCosting | undefined = result.data?.[0]

      if (costing) {
        setCostBreakdown({
          seedCost: costing.seedCost,
          soilCost: costing.soilCost,
          trayCost: costing.trayCost,
          laborCost: costing.laborCost,
          waterCost: costing.waterCost,
          electricityCost: costing.electricityCost,
          packagingCost: costing.packagingCost,
          overheadCost: costing.overheadCost,
          totalCostPerTray: costing.totalCostPerTray,
          costPerGram: costing.costPerGram,
          costPerServing: costing.costPerServing || undefined,
        })
      } else {
        // Use default values from microgreen if no costing exists
        const microgreen = microgreens.find(m => m.id === selectedMicrogreenId)
        if (microgreen) {
          const seedCost = microgreen.defaultSeedCostPerGram || 0
          const soilCost = microgreen.defaultSoilCostPerTray || 0
          const trayCost = microgreen.defaultTrayCost || 0
          const totalCostPerTray = seedCost + soilCost + trayCost
          const costPerGram = microgreen.yieldPerTray > 0 ? totalCostPerTray / microgreen.yieldPerTray : 0
          
          setCostBreakdown({
            seedCost,
            soilCost,
            trayCost,
            laborCost: 0,
            waterCost: 0,
            electricityCost: 0,
            packagingCost: 0,
            overheadCost: 0,
            totalCostPerTray,
            costPerGram,
            costPerServing: costPerGram * 30,
          })
        }
      }

      // Find cheapest suppliers for this microgreen
      const supplierResponse = await fetch(`/api/suppliers`)
      if (supplierResponse.ok) {
        const suppliersData = await supplierResponse.json()
        const cheapest: CheapestSupplier[] = []
        
        for (const supplier of suppliersData.data || []) {
          const priceRes = await fetch(`/api/suppliers/${supplier.id}/prices`)
          if (priceRes.ok) {
            const pricesData = await priceRes.json()
            const microgreenPrice = pricesData.data?.find(
              (p: SupplierPrice) => p.microgreenId === selectedMicrogreenId
            )
            if (microgreenPrice) {
              cheapest.push({
                microgreenId: selectedMicrogreenId,
                supplier,
                price: microgreenPrice.unitPrice,
              })
            }
          }
        }
        
        cheapest.sort((a, b) => a.price - b.price)
        setCheapestSuppliers(cheapest.slice(0, 3))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate cost')
    } finally {
      setIsCalculating(false)
    }
  }

  const calculateMixCost = async () => {
    if (!selectedMixId) return

    try {
      setIsCalculating(true)
      setError(null)

      const response = await fetch(`/api/costing/mix?mixId=${selectedMixId}&defaultOnly=true`)
      if (!response.ok) throw new Error('Failed to fetch mix costing data')
      
      const result = await response.json()
      const costing: MixCosting | undefined = result.data?.[0]

      if (costing) {
        setCostBreakdown({
          seedCost: costing.ingredientsCost,
          soilCost: 0,
          trayCost: 0,
          laborCost: costing.laborCost,
          waterCost: 0,
          electricityCost: 0,
          packagingCost: costing.packagingCost,
          overheadCost: costing.overheadCost,
          totalCostPerTray: costing.totalCostPerBatch,
          costPerGram: 0,
          costPerServing: costing.costPerServing,
        })
      } else {
        setError('No costing data found for this mix. Please create a costing entry first.')
        setCostBreakdown(null)
      }
      
      setCheapestSuppliers([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate mix cost')
    } finally {
      setIsCalculating(false)
    }
  }

  const handleCalculate = () => {
    if (activeTab === 'microgreen') {
      calculateMicrogreenCost()
    } else {
      calculateMixCost()
    }
  }

  const microgreenOptions = microgreens.map(m => ({
    value: m.id,
    label: `${m.name}${m.variety ? ` (${m.variety})` : ''}`,
  }))

  const mixOptions = mixes.map(m => ({
    value: m.id,
    label: m.name,
  }))

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cost Calculator</h1>
        <p className="text-gray-500">Calculate production costs for microgreens and mixes</p>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchData} />}

      {/* Tab Selection */}
      <div className="flex space-x-1 rounded-xl bg-gray-100 p-1">
        <button
          onClick={() => {
            setActiveTab('microgreen')
            setCostBreakdown(null)
            setCheapestSuppliers([])
          }}
          className={`flex items-center justify-center w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === 'microgreen'
              ? 'bg-white text-green-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Leaf className="h-4 w-4 mr-2" />
          Microgreen
        </button>
        <button
          onClick={() => {
            setActiveTab('mix')
            setCostBreakdown(null)
            setCheapestSuppliers([])
          }}
          className={`flex items-center justify-center w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === 'mix'
              ? 'bg-white text-green-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FlaskConical className="h-4 w-4 mr-2" />
          Mix
        </button>
      </div>

      {/* Selection Form */}
      <Card>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTab === 'microgreen' ? (
              <Select
                label="Select Microgreen"
                options={microgreenOptions}
                value={selectedMicrogreenId}
                onChange={(e) => setSelectedMicrogreenId(e.target.value)}
                placeholder="Choose a microgreen..."
              />
            ) : (
              <Select
                label="Select Mix"
                options={mixOptions}
                value={selectedMixId}
                onChange={(e) => setSelectedMixId(e.target.value)}
                placeholder="Choose a mix..."
              />
            )}
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleCalculate}
              isLoading={isCalculating}
              disabled={activeTab === 'microgreen' ? !selectedMicrogreenId : !selectedMixId}
            >
              <Calculator className="h-4 w-4 mr-2" />
              Calculate Cost
            </Button>
          </div>
        </div>
      </Card>

      {/* Cost Breakdown */}
      {costBreakdown && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Cost Breakdown" subtitle="Detailed cost components per tray/batch">
            <div className="space-y-3">
              <CostRow label="Seed Cost" value={costBreakdown.seedCost} icon={Package} />
              {activeTab === 'microgreen' && (
                <>
                  <CostRow label="Soil Cost" value={costBreakdown.soilCost} icon={Package} />
                  <CostRow label="Tray Cost" value={costBreakdown.trayCost} icon={Package} />
                </>
              )}
              <CostRow label="Labor Cost" value={costBreakdown.laborCost} icon={DollarSign} />
              {activeTab === 'microgreen' && (
                <>
                  <CostRow label="Water Cost" value={costBreakdown.waterCost} icon={DollarSign} />
                  <CostRow label="Electricity Cost" value={costBreakdown.electricityCost} icon={DollarSign} />
                </>
              )}
              <CostRow label="Packaging Cost" value={costBreakdown.packagingCost} icon={Package} />
              <CostRow label="Overhead Cost" value={costBreakdown.overheadCost} icon={TrendingUp} />
              
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total Cost per Tray/Batch</span>
                  <span className="font-bold text-lg text-green-700">
                    ${costBreakdown.totalCostPerTray.toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cost per Gram</span>
                  <span className="font-medium text-gray-900">
                    ${costBreakdown.costPerGram.toFixed(4)}
                  </span>
                </div>
                {costBreakdown.costPerServing && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-600">Cost per Serving (30g)</span>
                    <span className="font-medium text-gray-900">
                      ${costBreakdown.costPerServing.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Cheapest Suppliers */}
          {activeTab === 'microgreen' && cheapestSuppliers.length > 0 && (
            <Card title="Cheapest Suppliers" subtitle="Best prices for seed/supplies">
              <div className="space-y-3">
                {cheapestSuppliers.map((item, index) => (
                  <div
                    key={item.supplier.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-green-100 text-green-700' :
                        index === 1 ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.supplier.name}</p>
                        {item.supplier.isPreferred && (
                          <span className="text-xs text-green-600">Preferred Supplier</span>
                        )}
                      </div>
                    </div>
                    <span className="font-semibold text-gray-900">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Empty State */}
      {!costBreakdown && !isCalculating && (
        <EmptyState
          title="Ready to calculate"
          description="Select a microgreen or mix and click Calculate to see the cost breakdown."
          icon={<Calculator className="h-12 w-12 text-gray-400" />}
        />
      )}
    </div>
  )
}

function CostRow({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Package }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-gray-400" />
        <span className="text-gray-700">{label}</span>
      </div>
      <span className="font-medium text-gray-900">${value.toFixed(2)}</span>
    </div>
  )
}

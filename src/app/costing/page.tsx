'use client'

import { useEffect, useState } from 'react'
import { Leaf, Package, Zap, Users, Beaker, Droplets, Grid3X3, Calculator, Save, TrendingUp, Percent } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { Microgreen, Supplier } from '@/types'

// Fixed production parameters
const TRAY_USES = 1000
const SOIL_PER_TRAY_GRAMS = 500

interface CostConfig {
  // Tray & Equipment
  trayCost: number
  trayUses: number
  fabricPaperCost: number
  
  // Growing Medium
  soilCostPerKg: number
  soilPerTrayGrams: number
  
  // Utilities
  waterCostPerTray: number
  electricityCostPerTray: number
  
  // Labor
  laborCostPerTray: number
  
  // Pricing
  marginPercent: number
}

interface CostCalculation {
  microgreenId: string
  microgreenName: string
  variety?: string
  
  // Inputs
  seedingDensity: number
  yieldPerTray: number
  seedCostPerGram: number
  
  // Cost per Tray breakdown
  trayAmortizedCost: number
  soilCost: number
  fabricPaperCost: number
  waterCost: number
  electricityCost: number
  laborCost: number
  seedCost: number
  totalCostPerTray: number
  
  // Cost per gram
  costPerGram: number
  
  // Pricing
  marginPercent: number
  listPricePerGram: number
  
  // With discount
  discountPercent: number
  finalPricePerGram: number
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
  marginPercent: 50,
}

export default function CostingPage() {
  const [activeTab, setActiveTab] = useState<'config' | 'calculator'>('config')
  const [microgreens, setMicrogreens] = useState<Microgreen[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Cost configuration
  const [costConfig, setCostConfig] = useState<CostConfig>(defaultCostConfig)
  
  // Calculator
  const [selectedMicrogreenId, setSelectedMicrogreenId] = useState('')
  const [discountPercent, setDiscountPercent] = useState(0)
  const [calculation, setCalculation] = useState<CostCalculation | null>(null)

  useEffect(() => {
    fetchData()
    // Load saved config
    const savedConfig = localStorage.getItem('costConfig')
    if (savedConfig) {
      setCostConfig(JSON.parse(savedConfig))
    }
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [microgreensRes, suppliersRes] = await Promise.all([
        fetch('/api/microgreens'),
        fetch('/api/suppliers'),
      ])

      if (!microgreensRes.ok) throw new Error('Failed to fetch microgreens')
      if (!suppliersRes.ok) throw new Error('Failed to fetch suppliers')

      const [microgreensData, suppliersData] = await Promise.all([
        microgreensRes.json(),
        suppliersRes.json(),
      ])

      setMicrogreens(microgreensData.data || [])
      setSuppliers(suppliersData.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const saveConfig = () => {
    localStorage.setItem('costConfig', JSON.stringify(costConfig))
    alert('Configuration saved!')
  }

  const calculateCosts = () => {
    if (!selectedMicrogreenId) return
    
    const microgreen = microgreens.find(m => m.id === selectedMicrogreenId)
    if (!microgreen) return

    const seedingDensity = microgreen.seedingDensity || 0
    const yieldPerTray = microgreen.yieldPerTray || 0
    const seedCostPerGram = microgreen.defaultSeedCostPerGram || 0

    // Calculate cost per tray
    const trayAmortizedCost = costConfig.trayCost / costConfig.trayUses
    const soilCost = (costConfig.soilCostPerKg / 1000) * costConfig.soilPerTrayGrams
    const fabricPaperCost = costConfig.fabricPaperCost
    const waterCost = costConfig.waterCostPerTray
    const electricityCost = costConfig.electricityCostPerTray
    const laborCost = costConfig.laborCostPerTray
    const seedCost = seedingDensity * seedCostPerGram

    const totalCostPerTray = trayAmortizedCost + soilCost + fabricPaperCost + 
                             waterCost + electricityCost + laborCost + seedCost

    // Cost per gram
    const costPerGram = yieldPerTray > 0 ? totalCostPerTray / yieldPerTray : 0

    // List price with margin
    const marginMultiplier = 1 + (costConfig.marginPercent / 100)
    const listPricePerGram = costPerGram * marginMultiplier

    // Final price with discount
    const discountMultiplier = 1 - (discountPercent / 100)
    const finalPricePerGram = listPricePerGram * discountMultiplier

    setCalculation({
      microgreenId: microgreen.id,
      microgreenName: microgreen.name,
      variety: microgreen.variety || undefined,
      seedingDensity,
      yieldPerTray,
      seedCostPerGram,
      trayAmortizedCost,
      soilCost,
      fabricPaperCost,
      waterCost,
      electricityCost,
      laborCost,
      seedCost,
      totalCostPerTray,
      costPerGram,
      marginPercent: costConfig.marginPercent,
      listPricePerGram,
      discountPercent,
      finalPricePerGram,
    })
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Costing</h1>
        <p className="text-gray-500">Calculate production costs and pricing per microgreen</p>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchData} />}

      {/* Tab Selection */}
      <div className="flex space-x-1 rounded-xl bg-gray-100 p-1">
        <button
          onClick={() => setActiveTab('config')}
          className={`flex items-center justify-center w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === 'config'
              ? 'bg-white text-green-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Package className="h-4 w-4 mr-2" />
          Cost Configuration
        </button>
        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex items-center justify-center w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === 'calculator'
              ? 'bg-white text-green-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Calculator className="h-4 w-4 mr-2" />
          Cost Calculator
        </button>
      </div>

      {activeTab === 'config' ? (
        <div className="space-y-6">
          {/* Tray & Equipment */}
          <Card title="Tray & Equipment" subtitle="Reusable equipment costs (amortized over uses)">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Tray Cost (R)"
                type="number"
                step="0.01"
                value={costConfig.trayCost}
                onChange={(e) => setCostConfig({ ...costConfig, trayCost: parseFloat(e.target.value) || 0 })}
                hint={`Amortized: R${(costConfig.trayCost / costConfig.trayUses).toFixed(4)} per use`}
              />
              <Input
                label="Tray Uses (times)"
                type="number"
                value={costConfig.trayUses}
                onChange={(e) => setCostConfig({ ...costConfig, trayUses: parseInt(e.target.value) || 1000 })}
                hint="How many times a tray can be reused"
              />
              <Input
                label="Fabric Paper Cost (R)"
                type="number"
                step="0.01"
                value={costConfig.fabricPaperCost}
                onChange={(e) => setCostConfig({ ...costConfig, fabricPaperCost: parseFloat(e.target.value) || 0 })}
                hint="Cost per tray"
              />
            </div>
          </Card>

          {/* Growing Medium */}
          <Card title="Growing Medium" subtitle="Soil costs per tray">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Soil Cost (R per kg)"
                type="number"
                step="0.01"
                value={costConfig.soilCostPerKg}
                onChange={(e) => setCostConfig({ ...costConfig, soilCostPerKg: parseFloat(e.target.value) || 0 })}
              />
              <Input
                label="Soil per Tray (grams)"
                type="number"
                value={costConfig.soilPerTrayGrams}
                onChange={(e) => setCostConfig({ ...costConfig, soilPerTrayGrams: parseInt(e.target.value) || 500 })}
                hint={`Cost per tray: R${((costConfig.soilCostPerKg / 1000) * costConfig.soilPerTrayGrams).toFixed(2)}`}
              />
            </div>
          </Card>

          {/* Utilities */}
          <Card title="Utilities" subtitle="Water and electricity per tray">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Droplets className="h-5 w-5 text-blue-500" />
                <Input
                  label="Water Cost (R per tray)"
                  type="number"
                  step="0.01"
                  value={costConfig.waterCostPerTray}
                  onChange={(e) => setCostConfig({ ...costConfig, waterCostPerTray: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-yellow-500" />
                <Input
                  label="Electricity Cost (R per tray)"
                  type="number"
                  step="0.01"
                  value={costConfig.electricityCostPerTray}
                  onChange={(e) => setCostConfig({ ...costConfig, electricityCostPerTray: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </Card>

          {/* Labor */}
          <Card title="Labor" subtitle="Labor cost per tray">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-purple-500" />
              <Input
                label="Labor Cost (R per tray)"
                type="number"
                step="0.01"
                value={costConfig.laborCostPerTray}
                onChange={(e) => setCostConfig({ ...costConfig, laborCostPerTray: parseFloat(e.target.value) || 0 })}
                hint="Seeding, watering, harvesting labor"
              />
            </div>
          </Card>

          {/* Pricing */}
          <Card title="Pricing Defaults" subtitle="Default margin for calculations">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <Input
                label="Default Margin (%)"
                type="number"
                value={costConfig.marginPercent}
                onChange={(e) => setCostConfig({ ...costConfig, marginPercent: parseFloat(e.target.value) || 0 })}
                hint="Applied to cost per gram to get list price"
              />
            </div>
          </Card>

          {/* Summary */}
          <Card title="Base Cost Summary" subtitle="Fixed costs per tray (excluding seeds)">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <CostSummaryItem label="Tray" value={costConfig.trayCost / costConfig.trayUses} />
              <CostSummaryItem label="Soil" value={(costConfig.soilCostPerKg / 1000) * costConfig.soilPerTrayGrams} />
              <CostSummaryItem label="Fabric" value={costConfig.fabricPaperCost} />
              <CostSummaryItem label="Water" value={costConfig.waterCostPerTray} />
              <CostSummaryItem label="Electricity" value={costConfig.electricityCostPerTray} />
              <CostSummaryItem label="Labor" value={costConfig.laborCostPerTray} />
              <div className="col-span-2 bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="text-sm text-gray-600">Base Cost per Tray</div>
                <div className="text-xl font-bold text-green-700">
                  R{(
                    (costConfig.trayCost / costConfig.trayUses) +
                    ((costConfig.soilCostPerKg / 1000) * costConfig.soilPerTrayGrams) +
                    costConfig.fabricPaperCost +
                    costConfig.waterCostPerTray +
                    costConfig.electricityCostPerTray +
                    costConfig.laborCostPerTray
                  ).toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">(before seeds)</div>
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button onClick={saveConfig}>
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Microgreen Selection */}
          <Card title="Select Microgreen" subtitle="Choose a variety to calculate costs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Microgreen"
                value={selectedMicrogreenId}
                onChange={(e) => {
                  setSelectedMicrogreenId(e.target.value)
                  setCalculation(null)
                }}
                options={[
                  { value: '', label: 'Choose a microgreen...' },
                  ...microgreens.map(m => ({ 
                    value: m.id, 
                    label: `${m.name}${m.variety ? ` (${m.variety})` : ''}` 
                  }))
                ]}
              />
              <Input
                label="Discount (%)"
                type="number"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                hint="Applied to list price"
              />
            </div>
            <div className="mt-4 flex justify-end">
              <Button 
                onClick={calculateCosts} 
                disabled={!selectedMicrogreenId}
              >
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Costs
              </Button>
            </div>
          </Card>

          {/* Cost Breakdown */}
          {calculation && (
            <>
              {/* Microgreen Info */}
              <Card title={calculation.microgreenName} subtitle={calculation.variety}>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <div className="text-sm text-gray-600">Seeding Density</div>
                    <div className="text-lg font-bold text-amber-700">{calculation.seedingDensity}g</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="text-sm text-gray-600">Yield per Tray</div>
                    <div className="text-lg font-bold text-green-700">{calculation.yieldPerTray}g</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="text-sm text-gray-600">Seed Cost</div>
                    <div className="text-lg font-bold text-blue-700">R{calculation.seedCostPerGram.toFixed(2)}/g</div>
                  </div>
                </div>
              </Card>

              {/* Cost per Tray Breakdown */}
              <Card title="Cost per Tray Breakdown" subtitle="All costs to produce one tray">
                <div className="space-y-2">
                  <CostRow label="Tray (amortized)" value={calculation.trayAmortizedCost} color="gray" />
                  <CostRow label="Soil" value={calculation.soilCost} color="amber" />
                  <CostRow label="Fabric Paper" value={calculation.fabricPaperCost} color="gray" />
                  <CostRow label="Water" value={calculation.waterCost} color="blue" />
                  <CostRow label="Electricity" value={calculation.electricityCost} color="yellow" />
                  <CostRow label="Labor" value={calculation.laborCost} color="purple" />
                  <CostRow label="Seeds" value={calculation.seedCost} color="green" detail={`${calculation.seedingDensity}g × R${calculation.seedCostPerGram.toFixed(2)}/g`} />
                  
                  <div className="border-t-2 border-gray-200 pt-3 mt-3">
                    <div className="flex justify-between items-center p-4 bg-green-100 rounded-lg border-2 border-green-300">
                      <span className="font-bold text-gray-900">TOTAL COST PER TRAY</span>
                      <span className="text-2xl font-bold text-green-700">R{calculation.totalCostPerTray.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Cost per Gram & Pricing */}
              <Card title="Pricing Calculation" subtitle="From cost to final price">
                <div className="space-y-4">
                  {/* Step 1: Cost per Gram */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-600 mb-1">Step 1: Cost per Gram</div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>R{calculation.totalCostPerTray.toFixed(2)} ÷ {calculation.yieldPerTray}g</span>
                      <span>=</span>
                      <span className="text-lg font-bold text-gray-900">R{calculation.costPerGram.toFixed(4)}/g</span>
                    </div>
                  </div>

                  {/* Step 2: List Price with Margin */}
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-sm text-gray-600 mb-1">Step 2: List Price ({calculation.marginPercent}% margin)</div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>R{calculation.costPerGram.toFixed(4)} × {calculation.marginPercent}%</span>
                      <span>=</span>
                      <span className="text-lg font-bold text-green-700">R{calculation.listPricePerGram.toFixed(4)}/g</span>
                    </div>
                  </div>

                  {/* Step 3: Final Price with Discount */}
                  {calculation.discountPercent > 0 && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-sm text-gray-600 mb-1">Step 3: Final Price ({calculation.discountPercent}% discount)</div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>R{calculation.listPricePerGram.toFixed(4)} - {calculation.discountPercent}%</span>
                        <span>=</span>
                        <span className="text-lg font-bold text-blue-700">R{calculation.finalPricePerGram.toFixed(4)}/g</span>
                      </div>
                    </div>
                  )}

                  {/* Final Summary */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-green-100 p-4 rounded-lg border-2 border-green-300 text-center">
                      <div className="text-sm text-gray-600">List Price</div>
                      <div className="text-2xl font-bold text-green-700">R{calculation.listPricePerGram.toFixed(2)}/g</div>
                      <div className="text-xs text-gray-500 mt-1">
                        R{(calculation.listPricePerGram * 100).toFixed(2)} per 100g pack
                      </div>
                    </div>
                    {calculation.discountPercent > 0 && (
                      <div className="bg-blue-100 p-4 rounded-lg border-2 border-blue-300 text-center">
                        <div className="text-sm text-gray-600">Final Price ({calculation.discountPercent}% off)</div>
                        <div className="text-2xl font-bold text-blue-700">R{calculation.finalPricePerGram.toFixed(2)}/g</div>
                        <div className="text-xs text-gray-500 mt-1">
                          R{(calculation.finalPricePerGram * 100).toFixed(2)} per 100g pack
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function CostSummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-50 p-3 rounded-lg">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="font-semibold text-gray-900">R{value.toFixed(2)}</div>
    </div>
  )
}

function CostRow({ label, value, color, detail }: { label: string; value: number; color: string; detail?: string }) {
  const colorClasses: Record<string, string> = {
    green: 'bg-green-50 text-green-700 border-green-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    pink: 'bg-pink-50 text-pink-700 border-pink-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
  }
  
  return (
    <div className={`flex justify-between items-center p-3 rounded-lg border ${colorClasses[color] || colorClasses.gray}`}>
      <div>
        <span className="font-medium">{label}</span>
        {detail && <span className="text-sm text-gray-500 ml-2">({detail})</span>}
      </div>
      <span className="font-semibold">R{value.toFixed(2)}</span>
    </div>
  )
}

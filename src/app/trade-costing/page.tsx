'use client'

import { useEffect, useState } from 'react'
import { 
  Factory, 
  Save, 
  CheckCircle2,
  AlertCircle,
  Droplets,
  Zap,
  Users,
  Package,
  TrendingUp,
  Calculator,
  Leaf
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'

interface MineralItem {
  id: string
  name: string
  costPerTray: number
}

interface ProductionCostConfig {
  id?: string
  trayCost: number
  trayUses: number
  trayLengthCm: number
  trayWidthCm: number
  trayDepthCm: number
  fabricPaperCost: number
  soilCostPerKg: number
  soilPerTrayGrams: number
  waterCostPerTray: number
  electricityCostPerTray: number
  laborCostPerTray: number
  markupPercent: number
  updatedAt?: string

  // Retail Packaging Components
  retailClamShellCost: number
  retailInfoLabelCost: number
  retailIdLabelCost: number

  // Wholesale Packaging Components
  wholesalePackagingSmall: number
  wholesalePackagingMedium: number
  wholesalePackagingLarge: number
  wholesaleIdLabelCost: number

  // Mineral / Nutrient costs
  minerals: MineralItem[]
}

const defaultConfig: ProductionCostConfig = {
  trayCost: 50,
  trayUses: 1000,
  trayLengthCm: 42,
  trayWidthCm: 22,
  trayDepthCm: 2,
  fabricPaperCost: 2,
  soilCostPerKg: 15,
  soilPerTrayGrams: 500,
  waterCostPerTray: 1,
  electricityCostPerTray: 2,
  laborCostPerTray: 5,
  markupPercent: 100,

  // Retail Packaging Components
  retailClamShellCost: 3,
  retailInfoLabelCost: 0.5,
  retailIdLabelCost: 0.5,

  // Wholesale Packaging Components
  wholesalePackagingSmall: 1.5,
  wholesalePackagingMedium: 2,
  wholesalePackagingLarge: 3,
  wholesaleIdLabelCost: 0.5,

  // Mineral / Nutrient costs
  minerals: [
    { id: '1', name: 'Worm Tea', costPerTray: 0 },
    { id: '2', name: '', costPerTray: 0 },
    { id: '3', name: '', costPerTray: 0 },
    { id: '4', name: '', costPerTray: 0 },
  ],
}

export default function TradeCostingPage() {
  const [config, setConfig] = useState<ProductionCostConfig>(defaultConfig)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/production-costs')
      if (!response.ok) throw new Error('Failed to fetch production costs')
      const result = await response.json()
      if (result.data) {
        setConfig({ ...defaultConfig, ...result.data })
      }
    } catch (err) {
      console.error('Failed to load production costs:', err)
      // Use defaults if API fails
    } finally {
      setIsLoading(false)
    }
  }

  const updateConfig = (field: keyof ProductionCostConfig, value: number) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  const updateMineral = (id: string, field: keyof MineralItem, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      minerals: prev.minerals.map(m =>
        m.id === id ? { ...m, [field]: value } : m
      ),
    }))
  }

  const saveConfig = async () => {
    try {
      setIsSaving(true)
      setSuccessMessage(null)
      setError(null)
      
      const response = await fetch('/api/production-costs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      
      if (!response.ok) throw new Error('Failed to save production costs')
      
      setSuccessMessage('Trade costs saved successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save trade costs')
    } finally {
      setIsSaving(false)
    }
  }

  // Calculate derived values
  const trayAmortizedCost = config.trayCost / config.trayUses
  const soilCost = (config.soilCostPerKg / 1000) * config.soilPerTrayGrams
  const totalCostPerTray = trayAmortizedCost + config.fabricPaperCost + soilCost +
                          config.waterCostPerTray + config.electricityCostPerTray +
                          config.laborCostPerTray +
                          config.minerals.reduce((sum, m) => sum + (m.costPerTray || 0), 0)

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
              <Factory className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Trade Costing</h1>
              <p className="text-indigo-100 mt-1">Configure production costs per tray</p>
            </div>
          </div>
          
          <Button 
            onClick={saveConfig}
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

      {error && <ErrorMessage message={error} onRetry={fetchConfig} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Cost Inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tray Costs */}
          <Card title="Tray Costs" subtitle="Tray purchase and lifespan">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CostInput
                label="Tray Purchase Cost"
                value={config.trayCost}
                onChange={(v) => updateConfig('trayCost', v)}
                suffix="R"
                description="Initial cost to buy one tray"
              />
              
              <CostInput
                label="Tray Lifespan"
                value={config.trayUses}
                onChange={(v) => updateConfig('trayUses', v)}
                suffix="uses"
                description="How many times the tray can be reused"
              />
            </div>
            
            <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm text-indigo-900">
                <strong>Amortized Cost:</strong> R{trayAmortizedCost.toFixed(4)} per use
              </p>
            </div>
          </Card>

          {/* Tray Dimensions */}
          <Card title="Tray Dimensions" subtitle="Physical tray specifications">
            <div className="grid grid-cols-3 gap-4">
              <CostInput
                label="Length"
                value={config.trayLengthCm}
                onChange={(v) => updateConfig('trayLengthCm', v)}
                suffix="cm"
              />
              
              <CostInput
                label="Width"
                value={config.trayWidthCm}
                onChange={(v) => updateConfig('trayWidthCm', v)}
                suffix="cm"
              />
              
              <CostInput
                label="Depth"
                value={config.trayDepthCm}
                onChange={(v) => updateConfig('trayDepthCm', v)}
                suffix="cm"
              />
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Surface Area</p>
                <p className="text-lg font-bold text-gray-900">{config.trayLengthCm * config.trayWidthCm} cm²</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Volume</p>
                <p className="text-lg font-bold text-gray-900">{config.trayLengthCm * config.trayWidthCm * config.trayDepthCm} cm³</p>
              </div>
            </div>
          </Card>

          {/* Material Costs */}
          <Card title="Material Costs" subtitle="Soil, fabric, and growing medium">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CostInput
                label="Soil Cost"
                value={config.soilCostPerKg}
                onChange={(v) => updateConfig('soilCostPerKg', v)}
                suffix="R/kg"
                description="Cost per kilogram of soil"
              />
              
              <CostInput
                label="Soil per Tray"
                value={config.soilPerTrayGrams}
                onChange={(v) => updateConfig('soilPerTrayGrams', v)}
                suffix="g"
                description="Amount of soil used per tray"
              />
              
              <CostInput
                label="Fabric/Paper Cost"
                value={config.fabricPaperCost}
                onChange={(v) => updateConfig('fabricPaperCost', v)}
                suffix="R"
                description="Cost of fabric or paper per tray"
              />
            </div>
            
            <div className="mt-4 p-4 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-900">
                <strong>Soil Cost per Tray:</strong> R{soilCost.toFixed(4)}
              </p>
            </div>
          </Card>

          {/* Utility Costs */}
          <Card title="Utility Costs" subtitle="Water and electricity per tray">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CostInput
                label="Water Cost"
                value={config.waterCostPerTray}
                onChange={(v) => updateConfig('waterCostPerTray', v)}
                suffix="R"
                icon={<Droplets className="h-4 w-4 text-blue-500" />}
                description="Water cost per tray cycle"
              />
              
              <CostInput
                label="Electricity Cost"
                value={config.electricityCostPerTray}
                onChange={(v) => updateConfig('electricityCostPerTray', v)}
                suffix="R"
                icon={<Zap className="h-4 w-4 text-yellow-500" />}
                description="Electricity cost per tray (lights, fans, etc.)"
              />
            </div>
          </Card>

          {/* Labor Costs */}
          <Card title="Labor Costs" subtitle="Time and labor per tray">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CostInput
                label="Labor Cost"
                value={config.laborCostPerTray}
                onChange={(v) => updateConfig('laborCostPerTray', v)}
                suffix="R"
                icon={<Users className="h-4 w-4 text-green-500" />}
                description="Labor cost per tray (seeding, watering, harvesting)"
              />
              
              <CostInput
                label="Default Markup"
                value={config.markupPercent}
                onChange={(v) => updateConfig('markupPercent', v)}
                suffix="%"
                icon={<TrendingUp className="h-4 w-4 text-purple-500" />}
                description="Default markup percentage for pricing"
              />
            </div>
          </Card>

          {/* Mineral / Nutrient Costs */}
          <Card title="Mineral & Nutrient Costs" subtitle="Additives and nutrients per tray (e.g. worm tea)">
            <div className="space-y-3">
              {config.minerals.map((mineral, index) => (
                <div key={mineral.id} className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {index === 0 ? 'Name (e.g. Worm Tea)' : `Mineral ${index + 1}`}
                    </label>
                    <input
                      type="text"
                      value={mineral.name}
                      onChange={(e) => updateMineral(mineral.id, 'name', e.target.value)}
                      placeholder={index === 0 ? 'Worm Tea' : 'Mineral name'}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cost per Tray</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={mineral.costPerTray || ''}
                        onChange={(e) => updateMineral(mineral.id, 'costPerTray', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <span className="text-sm text-gray-500 font-medium">R</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {config.minerals.some(m => m.costPerTray > 0) && (
              <div className="mt-3 p-3 bg-teal-50 rounded-lg">
                <p className="text-sm text-teal-900">
                  <strong>Total mineral cost per tray:</strong> R{config.minerals.reduce((sum, m) => sum + (m.costPerTray || 0), 0).toFixed(2)}
                </p>
              </div>
            )}
          </Card>

          {/* Retail Packaging */}
          <Card title="Retail Packaging" subtitle="Clam shell and labels for retail packs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CostInput
                label="Clam Shell"
                value={config.retailClamShellCost}
                onChange={(v) => updateConfig('retailClamShellCost', v)}
                suffix="R"
                icon={<Package className="h-4 w-4 text-blue-500" />}
                description="Cost of clam shell packaging"
              />
              
              <CostInput
                label="Info Label"
                value={config.retailInfoLabelCost}
                onChange={(v) => updateConfig('retailInfoLabelCost', v)}
                suffix="R"
                icon={<Package className="h-4 w-4 text-green-500" />}
                description="Information label per pack"
              />
              
              <CostInput
                label="ID Label"
                value={config.retailIdLabelCost}
                onChange={(v) => updateConfig('retailIdLabelCost', v)}
                suffix="R"
                icon={<Package className="h-4 w-4 text-purple-500" />}
                description="ID label per pack"
              />
            </div>
          </Card>

          {/* Wholesale Packaging */}
          <Card title="Wholesale Packaging" subtitle="Packaging and ID label for wholesale packs">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <CostInput
                label="Small (60-100g)"
                value={config.wholesalePackagingSmall}
                onChange={(v) => updateConfig('wholesalePackagingSmall', v)}
                suffix="R"
                icon={<Package className="h-4 w-4 text-green-500" />}
                description="Packaging for small wholesale packs"
              />
              
              <CostInput
                label="Medium (250-500g)"
                value={config.wholesalePackagingMedium}
                onChange={(v) => updateConfig('wholesalePackagingMedium', v)}
                suffix="R"
                icon={<Package className="h-4 w-4 text-amber-500" />}
                description="Packaging for medium wholesale packs"
              />
              
              <CostInput
                label="Large (1-5kg)"
                value={config.wholesalePackagingLarge}
                onChange={(v) => updateConfig('wholesalePackagingLarge', v)}
                suffix="R"
                icon={<Package className="h-4 w-4 text-purple-500" />}
                description="Packaging for large wholesale packs"
              />
              
              <CostInput
                label="ID Label"
                value={config.wholesaleIdLabelCost}
                onChange={(v) => updateConfig('wholesaleIdLabelCost', v)}
                suffix="R"
                icon={<Package className="h-4 w-4 text-gray-500" />}
                description="ID label per wholesale pack"
              />
            </div>
          </Card>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          <Card title="Cost Summary" subtitle="Total production cost per tray">
            <div className="space-y-4">
              <CostRow label="Tray (amortized)" value={trayAmortizedCost} />
              <CostRow label="Soil" value={soilCost} />
              <CostRow label="Fabric/Paper" value={config.fabricPaperCost} />
              <CostRow label="Water" value={config.waterCostPerTray} />
              <CostRow label="Electricity" value={config.electricityCostPerTray} />
              <CostRow label="Labor" value={config.laborCostPerTray} />
              {config.minerals.filter(m => m.costPerTray > 0).map(m => (
                <CostRow key={m.id} label={m.name || 'Mineral'} value={m.costPerTray} />
              ))}
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total Cost per Tray</span>
                  <span className="text-2xl font-bold text-indigo-600">R{totalCostPerTray.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 mt-4">
                <p className="text-sm text-green-800">
                  <strong>With {config.markupPercent}% markup:</strong>
                </p>
                <p className="text-2xl font-bold text-green-700 mt-1">
                  R{(totalCostPerTray * (1 + config.markupPercent / 100)).toFixed(2)}
                </p>
              </div>
            </div>
          </Card>

          <Card title="Quick Links">
            <div className="space-y-2">
              <a 
                href="/costing"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <Calculator className="h-4 w-4 text-cyan-600" />
                </div>
                <span className="font-medium text-gray-900">Seed Costing</span>
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function CostInput({ 
  label, 
  value, 
  onChange, 
  suffix, 
  description,
  icon 
}: { 
  label: string; 
  value: number; 
  onChange: (v: number) => void; 
  suffix: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        <div className="flex items-center gap-2">
          {icon && <span>{icon}</span>}
          {label}
        </div>
      </label>
      <div className="relative">
        <input
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full pr-12 pl-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{suffix}</span>
      </div>
      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
  )
}

function CostRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-900">R{value.toFixed(2)}</span>
    </div>
  )
}

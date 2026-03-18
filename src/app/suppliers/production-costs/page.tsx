'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
  ArrowLeft,
  Calculator
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'

interface ProductionCostConfig {
  // Tray costs
  trayCost: number
  trayUses: number
  trayLengthCm: number
  trayWidthCm: number
  trayDepthCm: number
  
  // Material costs
  fabricPaperCost: number
  soilCostPerKg: number
  soilPerTrayGrams: number
  
  // Utility costs
  waterCostPerTray: number
  electricityCostPerTray: number
  
  // Labor costs
  laborCostPerTray: number
  
  // Default markup
  markupPercent: number
}

const defaultConfig: ProductionCostConfig = {
  // Tray costs
  trayCost: 50,
  trayUses: 1000,
  trayLengthCm: 42,
  trayWidthCm: 22,
  trayDepthCm: 2,
  
  // Material costs
  fabricPaperCost: 2,
  soilCostPerKg: 15,
  soilPerTrayGrams: 500,
  
  // Utility costs
  waterCostPerTray: 1,
  electricityCostPerTray: 2,
  
  // Labor costs
  laborCostPerTray: 5,
  
  // Default markup
  markupPercent: 100,
}

export default function ProductionCostsPage() {
  const [config, setConfig] = useState<ProductionCostConfig>(defaultConfig)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    // Load saved config from localStorage
    const savedConfig = localStorage.getItem('productionCostConfig')
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        setConfig({ ...defaultConfig, ...parsed })
      } catch (e) {
        console.error('Failed to load saved config:', e)
      }
    }
    setIsLoading(false)
  }, [])

  const updateConfig = (field: keyof ProductionCostConfig, value: number) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  const saveConfig = () => {
    try {
      setIsSaving(true)
      localStorage.setItem('productionCostConfig', JSON.stringify(config))
      setSuccessMessage('Production costs saved successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError('Failed to save production costs')
    } finally {
      setIsSaving(false)
    }
  }

  // Calculate derived values
  const trayAmortizedCost = config.trayCost / config.trayUses
  const soilCost = (config.soilCostPerKg / 1000) * config.soilPerTrayGrams
  const totalCostPerTray = trayAmortizedCost + config.fabricPaperCost + soilCost + 
                          config.waterCostPerTray + config.electricityCostPerTray + 
                          config.laborCostPerTray

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href="/suppliers"
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            
            <div className="p-3 bg-white/20 rounded-xl">
              <Factory className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Production Costs</h1>
              <p className="text-indigo-100 mt-1">Configure fixed production costs per tray</p>
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

      {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

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
              <Link 
                href="/suppliers"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="h-4 w-4 text-orange-600" />
                </div>
                <span className="font-medium text-gray-900">Back to Suppliers</span>
              </Link>
              
              <Link 
                href="/costing"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <Calculator className="h-4 w-4 text-cyan-600" />
                </div>
                <span className="font-medium text-gray-900">Seed Costing</span>
              </Link>
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

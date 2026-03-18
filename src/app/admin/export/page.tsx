'use client'

import { useState } from 'react'
import { Download, Database, FileJson, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/LoadingSpinner'

const exportOptions = [
  { 
    key: 'all', 
    label: 'Complete Database Backup', 
    description: 'Export all data including microgreens, mixes, costs, and configuration',
    icon: Database,
    color: 'bg-blue-100 text-blue-600'
  },
  { 
    key: 'microgreens', 
    label: 'Microgreens', 
    description: 'All microgreen varieties with costs and pricing',
    icon: FileJson,
    color: 'bg-green-100 text-green-600'
  },
  { 
    key: 'mixes', 
    label: 'Mixes', 
    description: 'All mix recipes and component breakdowns',
    icon: FileJson,
    color: 'bg-amber-100 text-amber-600'
  },
  { 
    key: 'production-costs', 
    label: 'Production Costs', 
    description: 'Trade costing configuration and settings',
    icon: FileSpreadsheet,
    color: 'bg-purple-100 text-purple-600'
  },
  { 
    key: 'pricing-tiers', 
    label: 'Pricing Tiers', 
    description: 'Customer tier configurations',
    icon: FileSpreadsheet,
    color: 'bg-pink-100 text-pink-600'
  },
]

export default function ExportPage() {
  const [isExporting, setIsExporting] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async (key: string) => {
    try {
      setIsExporting(key)
      setSuccessMessage(null)
      setError(null)

      let data: any = {}
      const timestamp = new Date().toISOString().split('T')[0]

      if (key === 'all' || key === 'microgreens') {
        const res = await fetch('/api/microgreens?limit=1000')
        const result = await res.json()
        data.microgreens = result.data
      }

      if (key === 'all' || key === 'mixes') {
        const res = await fetch('/api/mixes')
        const result = await res.json()
        data.mixes = result.data
      }

      if (key === 'all' || key === 'production-costs') {
        const res = await fetch('/api/production-costs')
        const result = await res.json()
        data.productionCosts = result.data
      }

      if (key === 'all' || key === 'pricing-tiers') {
        const res = await fetch('/api/pricing/tiers')
        const result = await res.json()
        data.pricingTiers = result.data
      }

      // Convert to JSON and download
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `local-farmer-${key}-${timestamp}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setSuccessMessage(`Successfully exported ${key === 'all' ? 'complete database' : key}`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Export &amp; Backup</h1>
        <p className="text-gray-500 mt-1">Download your data for backup or analysis</p>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <p className="text-green-800 font-medium">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {exportOptions.map((option) => (
          <Card key={option.key} title={option.label} subtitle={option.description}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${option.color}`}>
                  <option.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{option.label}</p>
                  <p className="text-sm text-gray-500">{option.description}</p>
                </div>
              </div>
              
              <Button
                onClick={() => handleExport(option.key)}
                disabled={isExporting === option.key}
                variant="secondary"
              >
                {isExporting === option.key ? (
                  <>
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
                  </>
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Card title="Import Data" subtitle="Restore from backup (coming soon)">
        <div className="text-center py-8 text-gray-500">
          <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Import functionality will be available in a future update.</p>
          <p className="text-sm mt-2">For now, you can manually restore by importing the JSON files into the database.</p>
        </div>
      </Card>
    </div>
  )
}

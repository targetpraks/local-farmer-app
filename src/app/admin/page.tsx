'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Leaf, 
  FlaskConical, 
  Users, 
  CreditCard, 
  Package,
  UserCircle,
  Upload,
  Download,
  FileText,
  Database,
  Settings,
  ArrowRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { Badge } from '@/components/ui/Badge'

interface SystemStats {
  microgreens: number
  mixes: number
  suppliers: number
  customerTiers: number
  subscriptionPlans: number
  users: number
}

interface ImportResult {
  success: boolean
  created: number
  errors?: { row: number; error: string }[]
}

const quickLinks = [
  { name: 'Microgreens', href: '/microgreens', icon: Leaf, color: 'bg-green-100 text-green-600', count: 'microgreens' },
  { name: 'Mixes', href: '/mixes', icon: FlaskConical, color: 'bg-blue-100 text-blue-600', count: 'mixes' },
  { name: 'Suppliers', href: '/suppliers', icon: Users, color: 'bg-orange-100 text-orange-600', count: 'suppliers' },
  { name: 'Pricing Tiers', href: '/pricing', icon: CreditCard, color: 'bg-purple-100 text-purple-600', count: 'customerTiers' },
  { name: 'Subscriptions', href: '/subscriptions', icon: Package, color: 'bg-pink-100 text-pink-600', count: 'subscriptionPlans' },
  { name: 'Costing', href: '/costing', icon: Database, color: 'bg-cyan-100 text-cyan-600', count: null },
]

const exportEntities = [
  { value: 'microgreens', label: 'Microgreens' },
  { value: 'mixes', label: 'Mixes' },
  { value: 'suppliers', label: 'Suppliers' },
  { value: 'customerTiers', label: 'Pricing Tiers' },
  { value: 'subscriptionPlans', label: 'Subscription Plans' },
  { value: 'users', label: 'Users' },
]

const importEntities = [
  { value: 'microgreens', label: 'Microgreens' },
  { value: 'suppliers', label: 'Suppliers' },
]

export default function AdminPage() {
  const router = useRouter()
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Import state
  const [importEntity, setImportEntity] = useState('')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Export state
  const [exportEntity, setExportEntity] = useState('')
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json')
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/stats')
      if (!response.ok) throw new Error('Failed to fetch system stats')
      const result = await response.json()
      setStats(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load system stats')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async () => {
    if (!importEntity || !importFile) return

    try {
      setIsImporting(true)
      setError(null)
      setImportResult(null)

      const text = await importFile.text()
      let data
      try {
        data = JSON.parse(text)
      } catch {
        // Try CSV parsing
        const lines = text.split('\n')
        const headers = lines[0].split(',').map(h => h.trim())
        data = lines.slice(1).filter(l => l.trim()).map(line => {
          const values = line.split(',')
          const obj: Record<string, string> = {}
          headers.forEach((h, i) => {
            obj[h] = values[i]?.trim() || ''
          })
          return obj
        })
      }

      const response = await fetch(`/api/admin/import?entity=${importEntity}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      })

      if (!response.ok) throw new Error('Failed to import data')
      
      const result = await response.json()
      setImportResult(result)
      fetchStats() // Refresh stats
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import data')
    } finally {
      setIsImporting(false)
    }
  }

  const handleExport = async () => {
    if (!exportEntity) return

    try {
      setIsExporting(true)
      setError(null)

      const response = await fetch(`/api/admin/export?entity=${exportEntity}&format=${exportFormat}`)
      
      if (!response.ok) throw new Error('Failed to export data')

      if (exportFormat === 'csv') {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${exportEntity}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const result = await response.json()
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${exportEntity}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data')
    } finally {
      setIsExporting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImportFile(file)
      setImportResult(null)
    }
  }

  if (isLoading && !stats) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500">System overview and data management</p>
      </div>

      {error && <ErrorMessage message={error} onRetry={() => { fetchStats(); setError(null); }} />}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Microgreens" value={stats.microgreens} color="green" icon={Leaf} />
          <StatCard label="Mixes" value={stats.mixes} color="blue" icon={FlaskConical} />
          <StatCard label="Suppliers" value={stats.suppliers} color="orange" icon={Users} />
          <StatCard label="Pricing Tiers" value={stats.customerTiers} color="purple" icon={CreditCard} />
          <StatCard label="Subscriptions" value={stats.subscriptionPlans} color="pink" icon={Package} />
          <StatCard label="Users" value={stats.users} color="gray" icon={UserCircle} />
        </div>
      )}

      {/* Quick Links */}
      <Card title="Quick Links" subtitle="Navigate to all modules">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="group flex items-center p-4 bg-gray-50 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all"
            >
              <div className={`p-2 rounded-lg mr-3 ${link.color}`}>
                <link.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 group-hover:text-green-700">{link.name}</p>
                {link.count && stats && (
                  <p className="text-sm text-gray-500">{(stats as any)[link.count]} items</p>
                )}
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-green-600" />
            </Link>
          ))}
        </div>
      </Card>

      {/* Data Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Section */}
        <Card title="Import Data" subtitle="Import data from JSON or CSV files">
          <div className="space-y-4">
            <Select
              label="Entity Type"
              options={importEntities}
              value={importEntity}
              onChange={(e) => {
                setImportEntity(e.target.value)
                setImportResult(null)
              }}
              placeholder="Select entity to import..."
            />
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                {importFile ? importFile.name : 'Drag and drop or click to upload'}
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Select File
              </Button>
            </div>

            {importResult && (
              <div className={`rounded-lg p-4 ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {importResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={importResult.success ? 'text-green-800' : 'text-red-800'}>
                    {importResult.success ? 'Import successful' : 'Import completed with errors'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Created {importResult.created} records
                  {importResult.errors && importResult.errors.length > 0 && (
                    <span className="text-red-600">, {importResult.errors.length} errors</span>
                  )}
                </p>
              </div>
            )}

            <Button
              onClick={handleImport}
              isLoading={isImporting}
              disabled={!importEntity || !importFile}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Data
            </Button>
          </div>
        </Card>

        {/* Export Section */}
        <Card title="Export Data" subtitle="Download data as JSON or CSV">
          <div className="space-y-4">
            <Select
              label="Entity Type"
              options={exportEntities}
              value={exportEntity}
              onChange={(e) => setExportEntity(e.target.value)}
              placeholder="Select entity to export..."
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setExportFormat('json')}
                  className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                    exportFormat === 'json'
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  JSON
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat('csv')}
                  className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                    exportFormat === 'csv'
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  CSV
                </button>
              </div>
            </div>

            <Button
              onClick={handleExport}
              isLoading={isExporting}
              disabled={!exportEntity}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </Card>
      </div>

      {/* System Info */}
      <Card title="System Information" subtitle="Application details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-1">Application</p>
            <p className="font-medium text-gray-900">Local Farmer</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-1">Version</p>
            <p className="font-medium text-gray-900">1.0.0</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-1">Environment</p>
            <p className="font-medium text-gray-900">{process.env.NODE_ENV || 'development'}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

function StatCard({ 
  label, 
  value, 
  color, 
  icon: Icon 
}: { 
  label: string; 
  value: number; 
  color: string;
  icon: typeof Leaf;
}) {
  const colorClasses: Record<string, string> = {
    green: 'bg-green-50 border-green-200 text-green-900',
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    pink: 'bg-pink-50 border-pink-200 text-pink-900',
    gray: 'bg-gray-50 border-gray-200 text-gray-900',
  }

  const iconColors: Record<string, string> = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
    pink: 'text-pink-600',
    gray: 'text-gray-600',
  }

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm opacity-75">{label}</p>
        </div>
        <Icon className={`h-8 w-8 ${iconColors[color]}`} />
      </div>
    </div>
  )
}

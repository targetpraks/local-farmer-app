'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { AlertTriangle, Database, Trash2 } from 'lucide-react'

export default function ResetDataPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{type: 'success' | 'error'; text: string} | null>(null)

  const reset = async (type: 'microgreens' | 'mixes' | 'production-config' | 'all') => {
    if (!window.confirm(`Are you sure you want to reset ${type}? This cannot be undone.`)) {
      return
    }

    setLoading(type)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/reset/' + type, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || `${type} reset successfully` })
      } else {
        setMessage({ type: 'error', text: data.error || 'Reset failed' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Reset failed' })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reset Data</h1>
        <p className="text-gray-500 mt-1">Restore default data for individual sections or clear everything.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Production Configuration" subtitle="Reset costs to defaults" className="border-orange-200">
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-4">
              Restore tray, materials, packaging, and markup settings to their default values.
            </p>
            <Button
              onClick={() => reset('production-config')}
              disabled={loading === 'production-config'}
              variant="secondary"
            >
              {loading === 'production-config' ? 'Resetting...' : <><Database className="h-4 w-4 mr-2" /> Reset Production Config</>}
            </Button>
          </div>
        </Card>

        <Card title="Microgreens" subtitle="Clear all microgreen data" className="border-red-200">
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-4">
              Delete all microgreen entries, including seed costs and yields. Does not affect mixes.
            </p>
            <Button
              onClick={() => reset('microgreens')}
              disabled={loading === 'microgreens'}
              variant="danger"
            >
              {loading === 'microgreens' ? 'Resetting...' : <><Trash2 className="h-4 w-4 mr-2" /> Reset Microgreens</>}
            </Button>
          </div>
        </Card>

        <Card title="Mixes" subtitle="Clear all mix recipes" className="border-red-200">
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-4">
              Delete all mix definitions and their components. Does not affect microgreens.
            </p>
            <Button
              onClick={() => reset('mixes')}
              disabled={loading === 'mixes'}
              variant="danger"
            >
              {loading === 'mixes' ? 'Resetting...' : <><Trash2 className="h-4 w-4 mr-2" /> Reset Mixes</>}
            </Button>
          </div>
        </Card>

        <Card title="All Data" subtitle="Nuclear option: clear everything" className="border-red-300 bg-red-50">
          <div className="p-4">
            <p className="text-sm text-red-700 mb-4 font-medium">
              ⚠️ This will delete ALL data: microgreens, mixes, production config, pricing tiers, subscriptions, suppliers, and logs.
            </p>
            <Button
              onClick={() => reset('all')}
              disabled={loading === 'all'}
              variant="danger"
              className="w-full"
            >
              {loading === 'all' ? 'Resetting...' : <><AlertTriangle className="h-4 w-4 mr-2" /> Reset Everything</>}
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <Link href="/admin" className="text-cyan-600 hover:underline text-sm">
          ← Back to Admin Dashboard
        </Link>
      </div>
    </div>
  )
}

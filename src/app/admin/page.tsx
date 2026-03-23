'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, Leaf, Sparkles, Zap, Clock, Database, ArrowRight, Settings } from 'lucide-react'

interface SummaryData {
  microgreenCount: number
  mushroomVarietyCount: number
  subscriptionCount: number
}

export default function AdminPage() {
  const [data, setData] = useState<SummaryData>({
    microgreenCount: 0,
    mushroomVarietyCount: 0,
    subscriptionCount: 0,
  })
  const [lastSync, setLastSync] = useState<string>('—')
  const [dbStatus, setDbStatus] = useState<'ok' | 'error' | 'checking'>('checking')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setDbStatus('checking')
      try {
        const [microRes, mushRes] = await Promise.all([
          fetch('/api/microgreens?limit=1').catch(() => null),
          fetch('/api/mushrooms/varieties').catch(() => null),
        ])

        const microCount = microRes?.ok ? (await microRes.json()).data?.length ?? 0 : 0
        const mushCount = mushRes?.ok ? (await mushRes.json()).data?.length ?? 0 : 0

        setData({
          microgreenCount: microCount,
          mushroomVarietyCount: mushCount,
          subscriptionCount: 0,
        })
        setDbStatus('ok')
        setLastSync(new Date().toLocaleTimeString())
      } catch {
        setDbStatus('error')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">⚙️ Admin</h1>
          <p className="text-gray-500 text-sm mt-0.5">System overview and quick access</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${dbStatus === 'ok' ? 'bg-green-500' : dbStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`} />
          <span className="text-xs text-gray-500">
            {dbStatus === 'ok' ? 'DB Connected' : dbStatus === 'error' ? 'DB Error' : 'Checking...'}
          </span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Microgreens</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {isLoading ? '—' : data.microgreenCount}
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Leaf className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Varieties in catalogue</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Mushroom Varieties</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">
                {isLoading ? '—' : data.mushroomVarietyCount}
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Active mushroom varieties</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Subscriptions</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                {isLoading ? '—' : data.subscriptionCount}
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Zap className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Active subscriptions</p>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="font-bold text-gray-900 text-base mb-3">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/pricing" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-orange-300 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Package className="h-5 w-5 text-orange-600" />
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-orange-400 transition-colors" />
            </div>
            <p className="font-bold text-gray-900 mt-3">Pricing Calculator</p>
            <p className="text-xs text-gray-500 mt-1">Set prices by tier and pack size</p>
          </Link>

          <Link href="/mushrooms/costing" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-orange-300 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-amber-600" />
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-orange-400 transition-colors" />
            </div>
            <p className="font-bold text-gray-900 mt-3">Mushroom Costing</p>
            <p className="text-xs text-gray-500 mt-1">Spawn costs and yield analysis</p>
          </Link>

          <Link href="/mushrooms/production" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-orange-300 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Leaf className="h-5 w-5 text-green-600" />
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-orange-400 transition-colors" />
            </div>
            <p className="font-bold text-gray-900 mt-3">Production Costing</p>
            <p className="text-xs text-gray-500 mt-1">Labour, overhead, material costs</p>
          </Link>

          <Link href="/subscriptions" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-orange-300 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-orange-400 transition-colors" />
            </div>
            <p className="font-bold text-gray-900 mt-3">Subscriptions</p>
            <p className="text-xs text-gray-500 mt-1">Subscription pricing & plans</p>
          </Link>

          <Link href="/costing" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-orange-300 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-orange-400 transition-colors" />
            </div>
            <p className="font-bold text-gray-900 mt-3">Microgreen Costing</p>
            <p className="text-xs text-gray-500 mt-1">Seed costs and tray economics</p>
          </Link>

          <Link href="/admin/pricing-tiers" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-orange-300 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Settings className="h-5 w-5 text-gray-600" />
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-orange-400 transition-colors" />
            </div>
            <p className="font-bold text-gray-900 mt-3">Pricing Tiers</p>
            <p className="text-xs text-gray-500 mt-1">Configure customer tiers & margins</p>
          </Link>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-bold text-gray-900 text-base mb-3 flex items-center gap-2">
          <Database className="h-4 w-4 text-gray-400" />
          System Info
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Database</p>
            <p className={`text-sm font-bold mt-0.5 ${dbStatus === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
              {dbStatus === 'ok' ? '✓ Connected' : dbStatus === 'error' ? '✗ Error' : 'Checking...'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Last Sync</p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">{lastSync}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Environment</p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">Development</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">App</p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">local-farmer-app</p>
          </div>
        </div>
      </div>
    </div>
  )
}

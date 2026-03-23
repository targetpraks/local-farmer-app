'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Leaf,
  Sprout,
  FlaskConical,
  TrendingUp,
  CreditCard,
  Package,
  Users,
  Settings,
  ArrowRight,
  Plus,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

interface DashboardStats {
  microgreens: number
  mixes: number
  suppliers: number
  customerTiers: number
  subscriptionPlans: number
  users: number
}

interface MushroomVariety {
  id: string
  displayName: string
  slug: string
  colour: string
  targetMarginPct: number
  isActive: boolean
}

const MUSHROOM_COLOURS: Record<string, string> = {
  pearl: '#f5f0dc',
  blue: '#6b8e9f',
  pink: '#f4a0a0',
  golden: '#e8c44a',
  king: '#d4a86a',
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [varieties, setVarieties] = useState<MushroomVariety[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats').then(r => r.json()),
      fetch('/api/mushrooms/varieties').then(r => r.json()),
    ]).then(([statsData, varietyData]) => {
      setStats(statsData.data ?? statsData)
      setVarieties(varietyData.data ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl shadow-lg p-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">🌱 Local Farmer</h1>
            <p className="text-green-100 text-base">
              Urban farming franchise — microgreens & mushrooms
            </p>
          </div>
          <Link
            href="/admin"
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Settings className="h-4 w-4" />
            Admin
          </Link>
        </div>
      </div>

      {/* Product Overview */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Catalog</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Microgreens */}
          <Link
            href="/microgreens"
            className="group bg-white rounded-xl border border-gray-200 p-6 hover:border-green-400 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-xl">
                  <Leaf className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Microgreens</h3>
                  <p className="text-xs text-gray-500">Variety catalog</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-green-600 transition-colors" />
            </div>
            <div className="text-4xl font-bold text-green-700">
              {loading ? '—' : (stats?.microgreens ?? 0)}
            </div>
            <p className="text-sm text-gray-500 mt-1">active varieties</p>
            <div className="mt-4 flex gap-1.5">
              <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-200">
                <CheckCircle2 className="h-3 w-3" />
                Catalog
              </span>
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                <TrendingUp className="h-3 w-3" />
                Costing
              </span>
            </div>
          </Link>

          {/* Mushrooms */}
          <Link
            href="/mushrooms"
            className="group bg-white rounded-xl border border-gray-200 p-6 hover:border-orange-400 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-3 rounded-xl">
                  <span className="text-3xl">🍄</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Mushrooms</h3>
                  <p className="text-xs text-gray-500">5 varieties</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-orange-600 transition-colors" />
            </div>
            <div className="text-4xl font-bold text-orange-700">
              {loading ? '—' : (varieties.length || '—')}
            </div>
            <p className="text-sm text-gray-500 mt-1">active varieties</p>
            <div className="mt-4 flex gap-1.5 flex-wrap">
              {varieties.map(v => (
                <div
                  key={v.id}
                  className="w-2.5 h-2.5 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: v.colour || MUSHROOM_COLOURS[v.slug] || '#888' }}
                  title={v.displayName}
                />
              ))}
            </div>
          </Link>

          {/* Mixes */}
          <Link
            href="/mixes"
            className="group bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-400 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <FlaskConical className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Mixes</h3>
                  <p className="text-xs text-gray-500">Seed mixes</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <div className="text-4xl font-bold text-blue-700">
              {loading ? '—' : (stats?.mixes ?? 0)}
            </div>
            <p className="text-sm text-gray-500 mt-1">mix recipes</p>
          </Link>
        </div>
      </div>

      {/* Business Operations */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Operations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/costing"
            className="group flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-5 hover:border-purple-400 hover:shadow-md transition-all"
          >
            <div className="bg-purple-100 p-3 rounded-xl">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-sm">Costing</h3>
              <p className="text-xs text-gray-500">Seed cost per gram</p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
          </Link>

          <Link
            href="/pricing"
            className="group flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-5 hover:border-pink-400 hover:shadow-md transition-all"
          >
            <div className="bg-pink-100 p-3 rounded-xl">
              <CreditCard className="h-6 w-6 text-pink-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-sm">Pricing</h3>
              <p className="text-xs text-gray-500">Calculator + tiers</p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-pink-600 transition-colors" />
          </Link>

          <Link
            href="/subscriptions"
            className="group flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-5 hover:border-cyan-400 hover:shadow-md transition-all"
          >
            <div className="bg-cyan-100 p-3 rounded-xl">
              <Package className="h-6 w-6 text-cyan-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-sm">Subscriptions</h3>
              <p className="text-xs text-gray-500">Recurring orders</p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-cyan-600 transition-colors" />
          </Link>

          <Link
            href="/suppliers"
            className="group flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-5 hover:border-orange-400 hover:shadow-md transition-all"
          >
            <div className="bg-orange-100 p-3 rounded-xl">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-sm">Suppliers</h3>
              <p className="text-xs text-gray-500">
                {loading ? '—' : stats?.suppliers === 0 ? 'None yet' : `${stats?.suppliers} suppliers`}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-orange-600 transition-colors" />
          </Link>
        </div>
      </div>

      {/* Pricing Tiers + Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pricing Tiers */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Pricing Tiers</h2>
            <Link href="/pricing" className="text-xs text-orange-600 hover:underline font-medium">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
              <div>
                <p className="font-bold text-green-900 text-sm">Retail</p>
                <p className="text-xs text-green-600">Direct to consumer</p>
              </div>
              <span className="font-bold text-green-700">Full price</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
              <div>
                <p className="font-bold text-amber-900 text-sm">Restaurant</p>
                <p className="text-xs text-amber-600">Food service</p>
              </div>
              <span className="font-bold text-amber-700">−10%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-200">
              <div>
                <p className="font-bold text-purple-900 text-sm">Wholesale</p>
                <p className="text-xs text-purple-600">Bulk pricing</p>
              </div>
              <span className="font-bold text-purple-700">−20%</span>
            </div>
          </div>
        </div>

        {/* Mushroom Varieties Quick View */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">🍄 Mushroom Varieties</h2>
            <Link href="/mushrooms" className="text-xs text-orange-600 hover:underline font-medium">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {varieties.map(v => (
              <div key={v.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full border border-white shadow-sm flex-shrink-0"
                    style={{ backgroundColor: v.colour || MUSHROOM_COLOURS[v.slug] || '#888' }}
                  />
                  <span className="text-sm font-medium text-gray-900">{v.displayName}</span>
                </div>
                <span className="text-xs text-gray-500">{v.targetMarginPct}% margin</span>
              </div>
            ))}
            {varieties.length === 0 && !loading && (
              <p className="text-sm text-gray-400 py-4 text-center">No varieties yet</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2.5">
            <Link
              href="/microgreens/new"
              className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-xl border border-green-200 transition-colors group"
            >
              <Plus className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-900 group-hover:text-green-700">Add microgreen variety</span>
            </Link>
            <Link
              href="/mushrooms/new"
              className="flex items-center gap-3 p-3 bg-orange-50 hover:bg-orange-100 rounded-xl border border-orange-200 transition-colors group"
            >
              <Plus className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-900 group-hover:text-orange-700">Add mushroom variety</span>
            </Link>
            <Link
              href="/costing"
              className="flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-colors group"
            >
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900 group-hover:text-purple-700">Open costing</span>
            </Link>
            <Link
              href="/pricing"
              className="flex items-center gap-3 p-3 bg-pink-50 hover:bg-pink-100 rounded-xl border border-pink-200 transition-colors group"
            >
              <CreditCard className="h-4 w-4 text-pink-600" />
              <span className="text-sm font-medium text-pink-900 group-hover:text-pink-700">Open pricing calculator</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Alerts / Setup needed */}
      {(stats?.suppliers === 0 || stats?.subscriptionPlans === 0) && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-amber-900 text-sm">Setup reminders</h3>
              <ul className="mt-2 space-y-1">
                {stats?.suppliers === 0 && (
                  <li className="text-sm text-amber-700">
                    No suppliers added yet — <Link href="/suppliers" className="underline font-medium hover:text-amber-900">add your seed and substrate suppliers</Link>
                  </li>
                )}
                {stats?.subscriptionPlans === 0 && (
                  <li className="text-sm text-amber-700">
                    No subscription plans yet — configure in <Link href="/subscriptions" className="underline font-medium hover:text-amber-900">Subscriptions</Link>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

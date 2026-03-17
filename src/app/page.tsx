'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Leaf, 
  FlaskConical, 
  Users, 
  CreditCard, 
  TrendingUp,
  Package,
  Settings
} from 'lucide-react'
import { cn } from '@/utils/cn'

interface DashboardStats {
  microgreens: number
  mixes: number
  suppliers: number
  customerTiers: number
  subscriptionPlans: number
  users: number
}

const quickLinks = [
  { name: 'Microgreens', href: '/microgreens', icon: Leaf, color: 'bg-green-100 text-green-600' },
  { name: 'Mixes', href: '/mixes', icon: FlaskConical, color: 'bg-blue-100 text-blue-600' },
  { name: 'Suppliers', href: '/suppliers', icon: Users, color: 'bg-orange-100 text-orange-600' },
  { name: 'Costing', href: '/costing', icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
  { name: 'Pricing', href: '/pricing', icon: CreditCard, color: 'bg-pink-100 text-pink-600' },
  { name: 'Subscriptions', href: '/subscriptions', icon: Package, color: 'bg-cyan-100 text-cyan-600' },
]

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data.data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading stats:', err)
        setLoading(false)
      })
  }, [])

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome to Local Farmer</h1>
        <p className="text-green-100 text-lg">
          Manage your microgreens, mixes, suppliers, and subscriptions all in one place.
        </p>
      </div>

      {/* Quick Stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 rounded-xl h-24" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Microgreens" value={stats.microgreens} color="green" />
          <StatCard label="Mixes" value={stats.mixes} color="blue" />
          <StatCard label="Suppliers" value={stats.suppliers} color="orange" />
          <StatCard label="Pricing Tiers" value={stats.customerTiers} color="purple" />
          <StatCard label="Subscriptions" value={stats.subscriptionPlans} color="pink" />
          <StatCard label="Users" value={stats.users} color="gray" />
        </div>
      ) : null}

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="group flex flex-col items-center p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-green-300 transition-all duration-200"
            >
              <div className={cn('p-3 rounded-xl mb-3', link.color)}>
                <link.icon className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-gray-900 group-hover:text-green-700">
                {link.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity - Placeholder */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Getting Started</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="bg-green-100 rounded-full p-2">
              <Leaf className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Add your microgreens</p>
              <p className="text-sm text-gray-500">
                Start by adding the microgreen varieties you grow. Include growing times and yields.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 rounded-full p-2">
              <FlaskConical className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Create mix recipes</p>
              <p className="text-sm text-gray-500">
                Define your signature mixes with component percentages and serving sizes.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-purple-100 rounded-full p-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Set up costing</p>
              <p className="text-sm text-gray-500">
                Calculate your production costs to understand profitability.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-pink-100 rounded-full p-2">
              <CreditCard className="h-4 w-4 text-pink-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Configure pricing</p>
              <p className="text-sm text-gray-500">
                Set up customer tiers and pricing rules for retail and wholesale.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    green: 'bg-green-50 border-green-200 text-green-900',
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    pink: 'bg-pink-50 border-pink-200 text-pink-900',
    gray: 'bg-gray-50 border-gray-200 text-gray-900',
  }

  return (
    <div className={cn('rounded-xl border p-4', colorClasses[color])}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm opacity-75">{label}</p>
    </div>
  )
}

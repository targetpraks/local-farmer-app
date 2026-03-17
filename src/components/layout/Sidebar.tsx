'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/utils/cn'
import {
  Leaf,
  FlaskConical,
  Users,
  TrendingUp,
  CreditCard,
  Package,
  LayoutDashboard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sprout,
  Heart,
} from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, color: 'from-blue-500 to-blue-600' },
  { name: 'Subscriptions', href: '/subscriptions', icon: Package, color: 'from-purple-500 to-pink-500' },
  { name: 'Pricing', href: '/pricing', icon: CreditCard, color: 'from-green-500 to-emerald-500' },
  { name: 'Microgreens', href: '/microgreens', icon: Leaf, color: 'from-green-400 to-green-600' },
  { name: 'Mixes', href: '/mixes', icon: FlaskConical, color: 'from-amber-500 to-orange-500' },
  { name: 'Costing', href: '/costing', icon: TrendingUp, color: 'from-cyan-500 to-blue-500' },
  { name: 'Suppliers', href: '/suppliers', icon: Users, color: 'from-indigo-500 to-purple-500' },
  { name: 'Admin', href: '/admin', icon: Settings, color: 'from-gray-500 to-gray-600' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={cn(
          'hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300',
          collapsed ? 'lg:w-20' : 'lg:w-64'
        )}
      >
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-gradient-to-b from-white to-gray-50 px-6">
          {/* Logo */}
          <div className="flex h-20 shrink-0 items-center justify-between pt-2">
            {!collapsed && (
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative h-12 w-12 rounded-xl overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow">
                  <Image
                    src="/logo.png"
                    alt="The Local Farmer"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900 leading-tight">The Local</span>
                  <span className="font-bold text-green-600 leading-tight">Farmer</span>
                </div>
              </Link>
            )}
            {collapsed && (
              <Link href="/" className="mx-auto">
                <div className="relative h-10 w-10 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                  <Image
                    src="/logo.png"
                    alt="The Local Farmer"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </Link>
            )}
          </div>

          {/* Tagline */}
          {!collapsed && (
            <div className="px-2 -mt-4">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Sprout className="h-3 w-3 text-green-500" />
                Growing goodness since 2020
              </p>
            </div>
          )}

          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-x-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        isActive
                          ? `bg-gradient-to-r ${item.color} text-white shadow-md`
                          : 'text-gray-700 hover:bg-white hover:shadow-sm hover:text-gray-900',
                        collapsed && 'justify-center px-2'
                      )}
                      title={collapsed ? item.name : undefined}
                    >
                      <div className={cn(
                        'h-8 w-8 rounded-lg flex items-center justify-center',
                        isActive ? 'bg-white/20' : 'bg-gray-100'
                      )}>
                        <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-gray-500')} />
                      </div>
                      {!collapsed && item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Footer */}
          {!collapsed && (
            <div className="border-t border-gray-200 py-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 border border-green-100">
                <div className="flex items-center gap-2 text-xs text-green-800">
                  <Heart className="h-3 w-3 text-red-500 fill-red-500" />
                  <span>Made with love for fresh food</span>
                </div>
              </div>
            </div>
          )}

          {/* Collapse button */}
          <div className="border-t border-gray-200 py-4">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex w-full items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors"
            >
              {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar - Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-200 shadow-lg">
        <nav className="flex justify-around px-2 py-2">
          {navigation.slice(0, 5).map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center px-3 py-1 text-xs font-medium transition-colors',
                  isActive ? 'text-green-600' : 'text-gray-500'
                )}
              >
                <div className={cn(
                  'h-8 w-8 rounded-lg flex items-center justify-center mb-1',
                  isActive ? `bg-gradient-to-r ${item.color}` : 'bg-gray-100'
                )}>
                  <item.icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-gray-500')} />
                </div>
                {item.name}
              </Link>
            )
          })}
          <Link
            href="/admin"
            className={cn(
              'flex flex-col items-center px-3 py-1 text-xs font-medium',
              pathname?.startsWith('/admin') ? 'text-green-600' : 'text-gray-500'
            )}
          >
            <div className={cn(
              'h-8 w-8 rounded-lg flex items-center justify-center mb-1',
              pathname?.startsWith('/admin') ? 'bg-gradient-to-r from-gray-500 to-gray-600' : 'bg-gray-100'
            )}>
              <Settings className={cn('h-4 w-4', pathname?.startsWith('/admin') ? 'text-white' : 'text-gray-500')} />
            </div>
            More
          </Link>
        </nav>
      </div>
    </>
  )
}

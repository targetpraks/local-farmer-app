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
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Subscriptions', href: '/subscriptions', icon: Package },
  { name: 'Pricing', href: '/pricing', icon: CreditCard },
  { name: 'Microgreens', href: '/microgreens', icon: Leaf },
  { name: 'Mixes', href: '/mixes', icon: FlaskConical },
  { name: 'Costing', href: '/costing', icon: TrendingUp },
  { name: 'Suppliers', href: '/suppliers', icon: Users },
  { name: 'Admin', href: '/admin', icon: Settings },
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
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
          <div className="flex h-16 shrink-0 items-center justify-between">
            {!collapsed && (
              <Link href="/" className="flex items-center gap-2">
                <div className="bg-green-600 rounded-lg p-2">
                  <Leaf className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-gray-900">Local Farmer</span>
              </Link>
            )}
            {collapsed && (
              <Link href="/" className="mx-auto">
                <div className="bg-green-600 rounded-lg p-2">
                  <Leaf className="h-5 w-5 text-white" />
                </div>
              </Link>
            )}
          </div>

          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-green-50 text-green-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                        collapsed && 'justify-center px-2'
                      )}
                      title={collapsed ? item.name : undefined}
                    >
                      <item.icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-green-600' : 'text-gray-400')} />
                      {!collapsed && item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Collapse button */}
          <div className="border-t border-gray-200 py-4">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex w-full items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            >
              {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar - Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-200">
        <nav className="flex justify-around px-2 py-2">
          {navigation.slice(0, 5).map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center px-3 py-1 text-xs font-medium',
                  isActive ? 'text-green-600' : 'text-gray-500'
                )}
              >
                <item.icon className={cn('h-5 w-5 mb-1', isActive ? 'text-green-600' : 'text-gray-400')} />
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
            <Settings className={cn('h-5 w-5 mb-1', pathname?.startsWith('/admin') ? 'text-green-600' : 'text-gray-400')} />
            More
          </Link>
        </nav>
      </div>
    </>
  )
}

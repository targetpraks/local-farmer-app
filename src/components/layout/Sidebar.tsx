'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/utils/cn'
import {
  Leaf, FlaskConical, Beaker, Factory, Sparkles, Tag,
  LayoutDashboard, Package, CreditCard, Settings, ChevronDown,
  Sprout, Heart,
} from 'lucide-react'
import Image from 'next/image'

// ── Section: Microgreens ──────────────────────────────────────────────────────

const MICROGREENS_ITEMS = [
  { name: 'All Microgreens', href: '/microgreens', icon: Leaf },
  { name: 'New Microgreen', href: '/microgreens/new', icon: Leaf },
  { name: 'Mixes', href: '/mixes', icon: FlaskConical },
]

const MICROGREEN_COSTING_ITEMS = [
  { name: 'Seed Costing', href: '/costing', icon: Beaker },
  { name: 'Trade Costing', href: '/trade-costing', icon: Factory },
]

// ── Section: Mushrooms ────────────────────────────────────────────────────────

const MUSHROOMS_ITEMS = [
  { name: 'All Batches', href: '/mushrooms', icon: Sparkles },
  { name: 'New Batch', href: '/mushrooms/new', icon: Sparkles },
  { name: 'Prices', href: '/mushrooms/prices', icon: Tag },
]

const MUSHROOM_COSTING_ITEMS = [
  { name: 'Batch Costing', href: '/mushrooms/costing', icon: Tag },
  { name: 'Production', href: '/mushrooms/production', icon: Factory },
]

// ── Main nav items ─────────────────────────────────────────────────────────────

const MAIN_NAV = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Subscriptions', href: '/subscriptions', icon: Package },
  { name: 'Pricing', href: '/pricing', icon: CreditCard },
  { name: 'Admin', href: '/admin', icon: Settings },
]

// ── Collapsible section component ─────────────────────────────────────────────

function NavSection({
  title, icon: Icon, items, baseColor, defaultOpen = false,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  items: { name: string; href: string; icon: React.ComponentType<{ className?: string }> }[]
  baseColor: string
  defaultOpen?: boolean
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(defaultOpen)
  const isActive = items.some(i => pathname === i.href || pathname?.startsWith(i.href + '/'))

  return (
    <li>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center justify-between w-full rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
          isActive || open
            ? `bg-gradient-to-r ${baseColor} text-white shadow-md`
            : 'text-gray-700 hover:bg-white hover:shadow-sm',
        )}
      >
        <div className="flex items-center gap-x-3">
          <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
            isActive || open ? 'bg-white/20' : 'bg-gray-100')}>
            <Icon className={cn('h-4 w-4', isActive || open ? 'text-white' : 'text-gray-500')} />
          </div>
          <span className={collapsed => collapsed ? 'hidden' : ''}>{title}</span>
        </div>
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <ul className="mt-1 ml-4 space-y-0.5 border-l border-gray-200 pl-3">
          {items.map(item => {
            const active = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <li key={item.name}>
                <Link href={item.href}
                  className={cn(
                    'flex items-center gap-x-2 rounded-lg px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-green-50 text-green-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )}>
                  <item.icon className="h-3.5 w-3.5 shrink-0" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </li>
  )
}

// ── Main Sidebar ───────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn(
        'hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300',
        collapsed ? 'lg:w-20' : 'lg:w-72',
      )}>
        <div className="flex grow flex-col gap-y-4 overflow-y-auto border-r border-gray-200 bg-gradient-to-b from-white to-gray-50 px-4 pb-4">

          {/* Logo */}
          <div className="flex h-20 shrink-0 items-center justify-between pt-2">
            {!collapsed && (
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative h-12 w-12 rounded-xl overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow">
                  <Image src="/logo.png" alt="The Local Farmer" fill className="object-cover" priority />
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
                  <Image src="/logo.png" alt="The Local Farmer" fill className="object-cover" priority />
                </div>
              </Link>
            )}
          </div>

          {!collapsed && (
            <p className="text-xs text-gray-500 flex items-center gap-1 px-2 -mt-3">
              <Sprout className="h-3 w-3 text-green-500" />
              Growing goodness since 2020
            </p>
          )}

          <nav className="flex flex-1 flex-col gap-y-1">
            {/* Main nav */}
            <ul role="list" className="space-y-1">
              {MAIN_NAV.map(item => {
                const active = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
                return (
                  <li key={item.name}>
                    <Link href={item.href}
                      className={cn(
                        'flex items-center gap-x-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        active
                          ? `bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md`
                          : 'text-gray-700 hover:bg-white hover:shadow-sm hover:text-gray-900',
                        collapsed && 'justify-center px-2',
                      )}
                      title={collapsed ? item.name : undefined}>
                      <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
                        active ? 'bg-white/20' : 'bg-gray-100')}>
                        <item.icon className={cn('h-4 w-4', active ? 'text-white' : 'text-gray-500')} />
                      </div>
                      {!collapsed && item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>

            {/* Divider */}
            <div className="my-3 border-t border-gray-200" />

            {/* Microgreens section */}
            {!collapsed && (
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 mb-1">
                🌱 Microgreens
              </p>
            )}
            <ul role="list" className="space-y-0.5">
              <NavSection
                title="Microgreens"
                icon={Leaf}
                items={MICROGREENS_ITEMS}
                baseColor="from-green-500 to-green-600"
                defaultOpen={pathname?.startsWith('/microgreens') || pathname?.startsWith('/mixes')}
              />
              <NavSection
                title="Costing"
                icon={Beaker}
                items={MICROGREEN_COSTING_ITEMS}
                baseColor="from-cyan-500 to-blue-500"
                defaultOpen={pathname?.startsWith('/costing') || pathname?.startsWith('/trade-costing')}
              />
            </ul>

            {/* Divider */}
            <div className="my-3 border-t border-gray-200" />

            {/* Mushrooms section */}
            {!collapsed && (
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 mb-1">
                🍄 Mushrooms
              </p>
            )}
            <ul role="list" className="space-y-0.5">
              <NavSection
                title="Mushrooms"
                icon={Sparkles}
                items={MUSHROOMS_ITEMS}
                baseColor="from-orange-400 to-amber-500"
                defaultOpen={pathname?.startsWith('/mushrooms')}
              />
              <NavSection
                title="Costing"
                icon={Tag}
                items={MUSHROOM_COSTING_ITEMS}
                baseColor="from-amber-600 to-yellow-500"
                defaultOpen={pathname?.startsWith('/mushrooms/costing') || pathname?.startsWith('/mushrooms/production')}
              />
            </ul>
          </nav>

          {/* Footer */}
          {!collapsed && (
            <div className="border-t border-gray-200 pt-3">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 border border-green-100">
                <div className="flex items-center gap-2 text-xs text-green-800">
                  <Heart className="h-3 w-3 text-red-500 fill-red-500" />
                  <span>Made with love for fresh food</span>
                </div>
              </div>
            </div>
          )}

          {/* Collapse button */}
          <div className="border-t border-gray-200 pt-2">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex w-full items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors">
              {collapsed ? '→' : '←'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-200 shadow-lg">
        <nav className="flex justify-around px-2 py-2">
          {MAIN_NAV.slice(0, 4).map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.name} href={item.href}
                className={cn('flex flex-col items-center px-2 py-1 text-xs font-medium',
                  active ? 'text-green-600' : 'text-gray-500')}>
                <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center mb-1',
                  active ? 'bg-green-100' : 'bg-gray-100')}>
                  <item.icon className="h-4 w-4" />
                </div>
                {item.name}
              </Link>
            )
          })}
          <Link href="/mushrooms"
            className={cn('flex flex-col items-center px-2 py-1 text-xs font-medium',
              pathname?.startsWith('/mushrooms') ? 'text-orange-600' : 'text-gray-500')}>
            <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center mb-1',
              pathname?.startsWith('/mushrooms') ? 'bg-orange-100' : 'bg-gray-100')}>
              <Sparkles className="h-4 w-4" />
            </div>
            Mushrooms
          </Link>
        </nav>
      </div>
    </>
  )
}
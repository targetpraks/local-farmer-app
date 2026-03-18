'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Search, Bell, User, Menu } from 'lucide-react'
import { cn } from '@/utils/cn'
import { GlobalSearch } from '@/components/GlobalSearch'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/microgreens': 'Microgreens',
  '/microgreens/new': 'New Microgreen',
  '/mixes': 'Mixes',
  '/mixes/new': 'New Mix',
  '/suppliers': 'Suppliers',
  '/suppliers/new': 'New Supplier',
  '/costing': 'Costing',
  '/pricing': 'Pricing',
  '/subscriptions': 'Subscriptions',
  '/admin': 'Admin',
}

export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const title = Object.entries(pageTitles).find(([path]) => 
    pathname?.startsWith(path) || pathname === path
  )?.[1] || 'Local Farmer'

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={() => setMobileMenuOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

      {/* Title */}
      <div className="flex flex-1 items-center gap-x-4 self-stretch lg:gap-x-6">
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>

      {/* Global Search */}
      <div className="hidden md:flex flex-1 justify-center">
        <GlobalSearch />
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-x-4 lg:gap-x-6">
        {/* Notifications */}
        <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 relative">
          <span className="sr-only">View notifications</span>
          <Bell className="h-6 w-6" aria-hidden="true" />
          {/* Notification badge */}
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
        </button>

        {/* Separator */}
        <div className="hidden lg:block h-6 w-px bg-gray-200" aria-hidden="true" />

        {/* Profile */}
        <button type="button" className="-m-1.5 p-1.5 text-gray-400 hover:text-gray-500">
          <span className="sr-only">Your profile</span>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-medium text-sm">
            RM
          </div>
        </button>
      </div>
    </header>
  )
}

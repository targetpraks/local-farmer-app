'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Search, Bell, User, Menu } from 'lucide-react'
import { cn } from '@/utils/cn'

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

      {/* Search */}
      <div className="hidden md:flex flex-1">
        <div className="relative max-w-md flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="search"
            name="search"
            id="search"
            className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6"
            placeholder="Search..."
          />
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-x-4 lg:gap-x-6">
        {/* Notifications */}
        <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
          <span className="sr-only">View notifications</span>
          <Bell className="h-6 w-6" aria-hidden="true" />
        </button>

        {/* Separator */}
        <div className="hidden lg:block h-6 w-px bg-gray-200" aria-hidden="true" />

        {/* Profile */}
        <button type="button" className="-m-1.5 p-1.5 text-gray-400 hover:text-gray-500">
          <span className="sr-only">Your profile</span>
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
            <User className="h-5 w-5 text-green-600" />
          </div>
        </button>
      </div>
    </header>
  )
}

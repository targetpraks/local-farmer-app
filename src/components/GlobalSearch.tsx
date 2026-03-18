'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, X, Leaf, FlaskConical, Users, TrendingUp, CreditCard, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface SearchResult {
  id: string
  name: string
  type: 'microgreen' | 'mix' | 'supplier' | 'page'
  subtitle?: string
  href: string
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      const [microgreensRes, mixesRes, suppliersRes] = await Promise.all([
        fetch('/api/microgreens?limit=100'),
        fetch('/api/mixes'),
        fetch('/api/suppliers'),
      ])

      const [microgreensData, mixesData, suppliersData] = await Promise.all([
        microgreensRes.json(),
        mixesRes.json(),
        suppliersRes.json(),
      ])

      const searchResults: SearchResult[] = []
      const lowerQuery = searchQuery.toLowerCase()

      // Search microgreens
      microgreensData.data?.forEach((m: any) => {
        if (m.name?.toLowerCase().includes(lowerQuery) || m.seedCode?.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            id: m.id,
            name: m.name,
            type: 'microgreen',
            subtitle: m.variety,
            href: '/microgreens',
          })
        }
      })

      // Search mixes
      mixesData.data?.forEach((m: any) => {
        if (m.name?.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            id: m.id,
            name: m.name,
            type: 'mix',
            subtitle: `${m.components?.length || 0} components`,
            href: '/mixes',
          })
        }
      })

      // Search suppliers
      suppliersData.data?.forEach((s: any) => {
        if (s.name?.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            id: s.id,
            name: s.name,
            type: 'supplier',
            subtitle: s.contactName,
            href: '/suppliers',
          })
        }
      })

      // Add page shortcuts
      const pages = [
        { name: 'Pricing', href: '/pricing', icon: CreditCard },
        { name: 'Costing', href: '/costing', icon: TrendingUp },
        { name: 'Subscriptions', href: '/subscriptions', icon: CreditCard },
      ]
      pages.forEach(p => {
        if (p.name.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            id: p.href,
            name: p.name,
            type: 'page',
            href: p.href,
          })
        }
      })

      setResults(searchResults.slice(0, 8))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => search(query), 150)
    return () => clearTimeout(timeout)
  }, [query, search])

  const handleSelect = (result: SearchResult) => {
    setIsOpen(false)
    setQuery('')
    router.push(result.href)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-500 text-sm transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded border text-xs">
          <span>⌘</span><span>K</span>
        </kbd>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
      
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search microgreens, mixes, suppliers..."
            className="flex-1 text-lg outline-none placeholder:text-gray-400"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {isLoading && (
            <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-green-600 rounded-full" />
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {results.length === 0 && query && !isLoading && (
            <div className="p-8 text-center text-gray-500">
              No results found for &quot;{query}&quot;
            </div>
          )}

          {results.length === 0 && !query && (
            <div className="p-6 text-sm text-gray-500">
              <p className="font-medium text-gray-900 mb-2">Quick navigation</p>
              <div className="grid grid-cols-2 gap-2">
                <QuickLink href="/microgreens" label="Microgreens" />
                <QuickLink href="/mixes" label="Mixes" />
                <QuickLink href="/pricing" label="Pricing" />
                <QuickLink href="/subscriptions" label="Subscriptions" />
              </div>
            </div>
          )}

          {results.map((result, index) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleSelect(result)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              <div className={`p-2 rounded-lg ${
                result.type === 'microgreen' ? 'bg-green-100 text-green-600' :
                result.type === 'mix' ? 'bg-blue-100 text-blue-600' :
                result.type === 'supplier' ? 'bg-orange-100 text-orange-600' :
                'bg-purple-100 text-purple-600'
              }`}>
                {result.type === 'microgreen' && <Leaf className="h-4 w-4" />}
                {result.type === 'mix' && <FlaskConical className="h-4 w-4" />}
                {result.type === 'supplier' && <Users className="h-4 w-4" />}
                {result.type === 'page' && <ArrowRight className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{result.name}</p>
                {result.subtitle && (
                  <p className="text-sm text-gray-500 truncate">{result.subtitle}</p>
                )}
              </div>
              <span className="text-xs text-gray-400 capitalize">{result.type}</span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 text-xs text-gray-500 border-t">
          <div className="flex gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <span>{results.length} results</span>
        </div>
      </div>
    </div>
  )
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
    >
      <ArrowRight className="h-3 w-3" />
      {label}
    </Link>
  )
}

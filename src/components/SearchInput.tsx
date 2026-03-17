'use client'

import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useState, useCallback } from 'react'

export interface SearchInputProps {
  placeholder?: string
  onSearch: (query: string) => void
  debounceMs?: number
  className?: string
}

export function SearchInput({ 
  placeholder = 'Search...', 
  onSearch, 
  debounceMs = 300,
  className 
}: SearchInputProps) {
  const [query, setQuery] = useState('')

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      onSearch(value)
    }, debounceMs),
    [onSearch, debounceMs]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    debouncedSearch(value)
  }

  const handleClear = () => {
    setQuery('')
    onSearch('')
  }

  return (
    <div className={className}>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          className="block w-full rounded-lg border-0 py-2 pl-10 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

function debounce<T extends (value: string) => void>(fn: T, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout>
  return (value: string) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(value), delay)
  }
}

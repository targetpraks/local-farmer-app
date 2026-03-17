'use client'

import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { Funnel, Check } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface FilterOption {
  value: string
  label: string
}

export interface FilterGroup {
  name: string
  options: FilterOption[]
  selected: string[]
  onChange: (selected: string[]) => void
}

export interface FilterDropdownProps {
  filters: FilterGroup[]
  className?: string
}

export function FilterDropdown({ filters, className }: FilterDropdownProps) {
  const activeFiltersCount = filters.reduce(
    (acc, group) => acc + group.selected.length,
    0
  )

  const clearFilters = () => {
    filters.forEach((group) => group.onChange([]))
  }

  return (
    <Menu as="div" className={cn('relative inline-block text-left', className)}>
      <div>
        <Menu.Button className="inline-flex items-center gap-x-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
          <Funnel className="-ml-1 mr-1.5 h-4 w-4 text-gray-400" aria-hidden="true" />
          Filter
          {activeFiltersCount > 0 && (
            <span className="ml-1.5 rounded-full bg-green-600 px-2 py-0.5 text-xs font-medium text-white">
              {activeFiltersCount}
            </span>
          )}
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-72 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="p-4 space-y-4">
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Clear all filters
              </button>
            )}
            
            {filters.map((group) => (
              <div key={group.name}>
                <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-2">
                  {group.name}
                </h4>
                <div className="space-y-1">
                  {group.options.map((option) => {
                    const isSelected = group.selected.includes(option.value)
                    return (
                      <button
                        key={option.value}
                        onClick={() => {
                          if (isSelected) {
                            group.onChange(group.selected.filter((v) => v !== option.value))
                          } else {
                            group.onChange([...group.selected, option.value])
                          }
                        }}
                        className={cn(
                          'w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-md transition-colors',
                          isSelected
                            ? 'bg-green-50 text-green-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        )}
                      >
                        {option.label}
                        {isSelected && <Check className="h-4 w-4" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}

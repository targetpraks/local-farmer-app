'use client'

import { cn } from '@/utils/cn'

interface SkeletonProps {
  className?: string
  rows?: number
  columns?: number
}

export function Skeleton({ className, rows = 5, columns = 4 }: SkeletonProps) {
  return (
    <div className={cn('space-y-4 animate-pulse', className)}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-12 flex-1 bg-gray-200 rounded"
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 p-6 animate-pulse', className)}>
      <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
      </div>
    </div>
  )
}

export function StatSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 p-4 animate-pulse', className)}>
      <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
      <div className="h-8 w-16 bg-gray-200 rounded" />
    </div>
  )
}

export function HeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('h-16 bg-white border-b border-gray-200 px-4 flex items-center gap-4 animate-pulse', className)}>
      <div className="h-8 w-32 bg-gray-200 rounded" />
      <div className="flex-1" />
      <div className="h-10 w-64 bg-gray-200 rounded" />
      <div className="h-10 w-10 bg-gray-200 rounded-full" />
    </div>
  )
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6 animate-pulse">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
          <div className="h-10 w-full bg-gray-200 rounded" />
        </div>
      ))}
      <div className="h-10 w-32 bg-gray-200 rounded mt-6" />
    </div>
  )
}

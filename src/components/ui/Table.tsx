'use client'

import { cn } from '@/utils/cn'
import { ReactNode } from 'react'

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('min-w-full divide-y divide-gray-200', className)}>
        {children}
      </table>
    </div>
  )
}

export function TableHead({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <thead className={cn('bg-gray-50', className)}>
      {children}
    </thead>
  )
}

export function TableBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <tbody className={cn('divide-y divide-gray-200 bg-white', className)}>
      {children}
    </tbody>
  )
}

export function TableRow({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <tr
      className={cn(onClick && 'cursor-pointer hover:bg-gray-50 transition-colors', className)}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

export function TableHeader({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <th
      scope="col"
      onClick={onClick}
      className={cn(
        'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
        onClick && 'cursor-pointer hover:bg-gray-100 select-none',
        className
      )}
    >
      {children}
    </th>
  )
}

export function TableCell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td className={cn('px-6 py-4 whitespace-nowrap text-sm text-gray-500', className)}>
      {children}
    </td>
  )
}

export function TableEmpty({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center">
        <p className="text-sm text-gray-500">{message}</p>
      </td>
    </tr>
  )
}

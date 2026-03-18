'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Users, Phone, Mail, MapPin, Package } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { EmptyState } from '@/components/EmptyState'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { DataTable } from '@/components/DataTable'

interface Supplier {
  id: string
  name: string
  contactName?: string
  email?: string
  phone?: string
  address?: string
  website?: string
  notes?: string
  isActive: boolean
  _count?: {
    seedProducts: number
  }
}

export default function SuppliersPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/suppliers')
      if (!response.ok) throw new Error('Failed to fetch suppliers')
      const result = await response.json()
      setSuppliers(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load suppliers')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/suppliers/${deleteId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete supplier')
      await fetchSuppliers()
      setDeleteId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete supplier')
    } finally {
      setIsDeleting(false)
    }
  }

  const columns: any[] = [
    {
      key: 'name',
      header: 'Supplier',
      sortable: true,
      render: (row: Supplier) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
            <span className="text-lg font-bold text-orange-600">{row.name.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.name}</div>
            {row.contactName && (
              <div className="text-sm text-gray-500">{row.contactName}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (row: Supplier) => (
        <div className="space-y-1">
          {row.email && (
            <a 
              href={`mailto:${row.email}`}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="h-3.5 w-3.5" />
              {row.email}
            </a>
          )}
          {row.phone && (
            <a 
              href={`tel:${row.phone}`}
              className="flex items-center gap-1.5 text-sm text-gray-600"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="h-3.5 w-3.5" />
              {row.phone}
            </a>
          )}
        </div>
      ),
    },
    {
      key: 'products',
      header: 'Products',
      render: (row: Supplier) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            {row._count?.seedProducts || 0} seed products
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: Supplier) => (
        <Badge 
          variant={row.isActive ? 'success' : 'default'}
          className={row.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
        >
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Supplier) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/suppliers/${row.id}`)
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setDeleteId(row.id)
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Suppliers</h1>
              <p className="text-orange-100 mt-1">Manage your seed suppliers • {suppliers.length} total</p>
            </div>
          </div>
          <Link href="/suppliers/new">
            <Button className="bg-white text-orange-600 hover:bg-orange-50">
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </Link>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchSuppliers} />}

      {suppliers.length === 0 ? (
        <EmptyState
          title="No suppliers yet"
          description="Add your first seed supplier to start tracking pricing and availability."
          icon={<Users className="h-12 w-12 text-gray-400" />}
          action={{
            label: 'Add Supplier',
            href: '/suppliers/new',
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={suppliers}
          keyExtractor={(row: any) => row.id}
          searchable
          searchKeys={['name', 'contactName', 'email']}
          onRowClick={(row: any) => router.push(`/suppliers/${row.id}`)}
          emptyMessage="No suppliers found"
          exportable
          title="suppliers"
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Supplier"
        message="Are you sure you want to delete this supplier? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  )
}

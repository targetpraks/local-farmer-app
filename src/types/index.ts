import { 
  Microgreen, 
  Mix, 
  MixComponent, 
  Supplier, 
  SupplierPrice,
  CustomerTier,
  CustomerTierPrice,
  SubscriptionPlan,
  MicrogreenCosting,
  MixCosting,
  CostFactor,
  User,
  ActivityLog,
  ExportImportLog,
  PriceUnitType,
  MarkupType,
  UserRole,
} from '@prisma/client'

export * from '@prisma/client'

// Extended types with relations
export type MicrogreenWithPrices = Microgreen & {
  supplierPrices: (SupplierPrice & { supplier: Supplier })[]
}

export type MixWithComponents = Mix & {
  components: (MixComponent & { microgreen: Microgreen })[]
}

export type SupplierWithPrices = Supplier & {
  prices: (SupplierPrice & { microgreen: Microgreen })[]
}

export type SubscriptionPlanWithTier = SubscriptionPlan & {
  tier: CustomerTier
}

export type CustomerTierWithPrices = CustomerTier & {
  prices: (CustomerTierPrice & { microgreen?: Microgreen; mix?: Mix })[]
}

// API Response types
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form input types
export interface MicrogreenFormData {
  name: string
  variety?: string
  description?: string
  growTime: number
  yieldPerTray: number
  seedingDensity: number
  defaultSeedCostPerGram?: number
  defaultSoilCostPerTray?: number
  defaultTrayCost?: number
  imageUrl?: string
}

export interface MixFormData {
  name: string
  description?: string
  totalWeight: number
  servingSize: number
  imageUrl?: string
  components: {
    microgreenId: string
    percentage: number
    weightGrams: number
  }[]
}

export interface SupplierFormData {
  name: string
  contactName?: string
  email?: string
  phone?: string
  address?: string
  website?: string
  paymentTerms?: string
  leadTimeDays?: number
  minOrderAmount?: number
  isPreferred?: boolean
  rating?: number
  notes?: string
}

export interface SupplierPriceFormData {
  supplierId: string
  microgreenId: string
  unitType: PriceUnitType
  unitPrice: number
  currency?: string
  moq?: number
  effectiveDate?: Date
  expiryDate?: Date
}

export interface CustomerTierFormData {
  name: string
  code: string
  description?: string
  markupType: MarkupType
  markupValue: number
  minimumMargin?: number
  volumeDiscountThreshold?: number
  volumeDiscountPercent?: number
}

export interface SubscriptionPlanFormData {
  name: string
  description?: string
  tierId: string
  minDurationWeeks: number
  maxDurationWeeks?: number
  weeklyServings: number
  servingSizeGrams: number
  includedMixIds: string[]
  weeklyPrice: number
  setupFee?: number
  deliveryFee?: number
  discount4Weeks?: number
  discount8Weeks?: number
  discount12Weeks?: number
  discount26Weeks?: number
  discount52Weeks?: number
  allowPause?: boolean
  allowCustomization?: boolean
}

export interface CostingFormData {
  microgreenId: string
  seedCost: number
  soilCost: number
  trayCost: number
  laborCost: number
  waterCost: number
  electricityCost: number
  packagingCost: number
  overheadCost: number
  isDefault?: boolean
  notes?: string
}

// Cost calculation types
export interface CostCalculation {
  microgreenId: string
  seedCost: number
  soilCost: number
  trayCost: number
  laborCost: number
  waterCost: number
  electricityCost: number
  packagingCost: number
  overheadCost: number
  totalCostPerTray: number
  costPerGram: number
  costPerServing?: number
}

// Pricing calculation types
export interface PricingCalculation {
  baseCost: number
  markupPercent: number
  markupAmount: number
  finalPrice: number
  margin: number
  marginPercent: number
}

// Dashboard types
export interface DashboardStats {
  totalMicrogreens: number
  totalMixes: number
  totalSuppliers: number
  totalSubscriptions: number
  activeSubscriptions: number
  monthlyRevenue: number
}

// Table filter types
export interface TableFilter {
  column: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith'
  value: string | number | boolean | null
}

export interface TableSort {
  column: string
  direction: 'asc' | 'desc'
}

// Import/Export types
export interface ImportPreview {
  rowCount: number
  columns: string[]
  sample: Record<string, unknown>[]
  errors?: { row: number; error: string }[]
}

export type ExportFormat = 'csv' | 'json' | 'xlsx'

// Activity log types
export interface ActivityLogWithUser extends ActivityLog {
  user?: User
}

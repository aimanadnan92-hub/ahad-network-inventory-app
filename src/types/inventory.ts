export interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  costPrice: number;
  retailPrice: number;
  minAlert: number;
  lastUpdated: string;
}

export interface ProductUpdate {
  productId: string;
  before: number;
  after: number;
  change: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'invoice' | 'manual' | 'temporary-out' | 'return';
  orderNumber?: string;
  productUpdates: ProductUpdate[];
  userId: string;
  userName: string;
  notes: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'staff' | 'viewer';
  name: string;
  createdAt: string;
  lastLogin?: string;
}

export type PackageType = 'bronze' | 'silver' | 'gold';

export interface Package {
  type: PackageType;
  name: string;
  multiplier: number;
  price: number;
  icon: string;
}

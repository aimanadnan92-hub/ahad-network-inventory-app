import { Product, ActivityLog, User } from '@/types/inventory';

const STORAGE_KEYS = {
  PRODUCTS: 'ahad-products',
  ACTIVITY_LOG: 'ahad-activity-log',
  USERS: 'ahad-users',
  CURRENT_USER: 'ahad-current-user',
} as const;

// Products
export const getProducts = (): Record<string, Product> => {
  const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
  if (stored) {
    return JSON.parse(stored);
  }
  
  // Initialize with default products
  const defaultProducts: Record<string, Product> = {
    'colostrum-p': {
      id: 'colostrum-p',
      name: 'Ahad Colostrum P',
      sku: 'ACP-001',
      stock: 930,
      costPrice: 37.00,
      retailPrice: 175.00,
      minAlert: 100,
      lastUpdated: new Date().toISOString(),
    },
    'colostrum-g': {
      id: 'colostrum-g',
      name: 'Ahad Colostrum G',
      sku: 'ACG-001',
      stock: 930,
      costPrice: 48.00,
      retailPrice: 150.00,
      minAlert: 100,
      lastUpdated: new Date().toISOString(),
    },
    'barley-best': {
      id: 'barley-best',
      name: 'Ahad Barley Best',
      sku: 'ABB-001',
      stock: 930,
      costPrice: 24.00,
      retailPrice: 135.00,
      minAlert: 100,
      lastUpdated: new Date().toISOString(),
    },
  };
  
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(defaultProducts));
  return defaultProducts;
};

export const saveProducts = (products: Record<string, Product>) => {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
};

export const updateProductStock = (productId: string, newStock: number) => {
  const products = getProducts();
  if (products[productId]) {
    products[productId].stock = newStock;
    products[productId].lastUpdated = new Date().toISOString();
    saveProducts(products);
  }
};

// Activity Log
export const getActivityLog = (): ActivityLog[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG);
  return stored ? JSON.parse(stored) : [];
};

export const addActivityLog = (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
  const logs = getActivityLog();
  const newLog: ActivityLog = {
    ...log,
    id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
  };
  logs.unshift(newLog);
  localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, JSON.stringify(logs));
  return newLog;
};

// Users
export const getUsers = (): User[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.USERS);
  if (stored) {
    return JSON.parse(stored);
  }
  
  // Initialize with default admin user
  const defaultUsers: User[] = [
    {
      id: 'user-001',
      email: 'admin@ahadnetwork.com',
      passwordHash: 'AhadNetwork2025!', // In production, this should be properly hashed
      role: 'admin',
      name: 'Admin User',
      createdAt: new Date().toISOString(),
    },
  ];
  
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
  return defaultUsers;
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const updateUserLastLogin = (userId: string) => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (user) {
    user.lastLogin = new Date().toISOString();
    saveUsers(users);
  }
};

// Current User Session
export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return stored ? JSON.parse(stored) : null;
};

export const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
};

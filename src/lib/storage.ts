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
  
  // Initialize with production stock levels (after 31 orders processed)
  const defaultProducts: Record<string, Product> = {
    'colostrum-p': {
      id: 'colostrum-p',
      name: 'Ahad Colostrum P',
      sku: 'ACP-001',
      stock: 914, // 1000 - 65(Gold) - 8(Silver) - 11(Bronze) - 2(Individual)
      costPrice: 37.00,
      retailPrice: 175.00,
      minAlert: 100,
      lastUpdated: new Date('2025-11-25T14:18:00').toISOString(),
    },
    'colostrum-g': {
      id: 'colostrum-g',
      name: 'Ahad Colostrum G',
      sku: 'ACG-001',
      stock: 916, // 1000 - 65(Gold) - 8(Silver) - 11(Bronze)
      costPrice: 48.00,
      retailPrice: 150.00,
      minAlert: 100,
      lastUpdated: new Date('2025-11-25T14:18:00').toISOString(),
    },
    'barley-best': {
      id: 'barley-best',
      name: 'Ahad Barley Best',
      sku: 'ABB-001',
      stock: 900, // 1000 - 65(Gold) - 8(Silver) - 11(Bronze) - 16(Individual)
      costPrice: 24.00,
      retailPrice: 135.00,
      minAlert: 100,
      lastUpdated: new Date('2025-11-25T14:18:00').toISOString(),
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
  if (stored) {
    return JSON.parse(stored);
  }
  
  // Initialize with real production orders (31 orders from WooCommerce)
  const defaultActivityLog = generateProductionOrders();
  localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, JSON.stringify(defaultActivityLog));
  return defaultActivityLog;
};

// Generate production orders from real WooCommerce data
const generateProductionOrders = (): ActivityLog[] => {
  const orders: ActivityLog[] = [];
  let activityCounter = 1;
  
  // Helper to create activity log entry
  const createLogEntry = (
    orderNumber: string,
    orderDate: string,
    customer: string,
    productId: string,
    productName: string,
    stockBefore: number,
    change: number
  ): ActivityLog => ({
    id: `activity-${String(activityCounter++).padStart(3, '0')}`,
    timestamp: new Date(orderDate).toISOString(),
    type: 'invoice',
    orderNumber,
    productUpdates: [{
      productId,
      before: stockBefore,
      after: stockBefore + change,
      change
    }],
    userId: 'system',
    userName: 'System',
    notes: `${customer} - Order #${orderNumber}`
  });
  
  // Track stock levels throughout processing
  let stockLevels = {
    'colostrum-p': 1000,
    'colostrum-g': 1000,
    'barley-best': 1000
  };
  
  // GOLD MEMBERSHIP ORDERS (13 orders - 5 of each)
  const goldOrders = [
    { order: '1437', date: '2024-10-24T07:07:00', customer: 'NORLIA BINTI BAHARUN' },
    { order: '150', date: '2024-10-24T08:49:00', customer: 'Nor Amalina binti Abdul Wahab' },
    { order: '151', date: '2024-10-24T09:06:00', customer: 'Sharifah Asma binti Syed Noh' },
    { order: '152', date: '2024-10-24T09:18:00', customer: 'Rizka Fathya Fancha' },
    { order: '154', date: '2024-10-24T09:28:00', customer: 'Titi Rahayu' },
    { order: '155', date: '2024-10-24T09:45:00', customer: 'Nadiah Athirah Azizan' },
    { order: '157', date: '2024-10-24T10:07:00', customer: 'Azizan Bin Aziz' },
    { order: '158', date: '2024-10-24T10:11:00', customer: 'ADLAN NAQIUDDIN BIN AZIZAN' },
    { order: '159', date: '2024-10-24T10:13:00', customer: 'Nur Hanis Shuhada binti Abu Hasim' },
    { order: '160', date: '2024-10-24T10:16:00', customer: 'Husaini Bin Abdullah' },
    { order: '161', date: '2024-10-24T10:19:00', customer: 'Farah Aiman Binti Ahmad Nurulazam' },
    { order: '1018', date: '2024-11-16T13:52:00', customer: 'AZIZAH' },
    { order: '1275', date: '2024-12-03T03:57:00', customer: 'Mohd Zulhelmi bin Kamaruzzaman' }
  ];
  
  goldOrders.forEach(({ order, date, customer }) => {
    ['colostrum-p', 'colostrum-g', 'barley-best'].forEach(productId => {
      const productName = productId === 'colostrum-p' ? 'Ahad Colostrum P' : 
                         productId === 'colostrum-g' ? 'Ahad Colostrum G' : 'Ahad Barley Best';
      orders.push(createLogEntry(order, date, customer, productId, productName, stockLevels[productId], -5));
      stockLevels[productId] -= 5;
    });
  });
  
  // BRONZE MEMBERSHIP ORDERS (11 orders - 1 of each)
  const bronzeOrders = [
    { order: '1227', date: '2024-11-25T13:40:00', customer: 'Romli bin Sidin' },
    { order: '1310', date: '2025-02-07T14:31:00', customer: 'Rahenah binti Rahim' },
    { order: '1351', date: '2025-03-07T16:03:00', customer: 'Ahmad Darus' },
    { order: '1352', date: '2025-03-07T16:12:00', customer: 'Inson Abdullah' },
    { order: '1373', date: '2025-08-13T00:55:00', customer: 'Mohd Zaki Bin Baharun' },
    { order: '1471', date: '2025-09-21T06:24:00', customer: 'Mohd Khaironi Bin Md Khairi' },
    { order: '1472', date: '2025-09-21T06:28:00', customer: 'Zakiah Binti Mat Saad' },
    { order: '1473', date: '2025-09-21T06:36:00', customer: 'HELEEJAILAH @ NORLAILY BINTI IBRAHIM' },
    { order: '1474', date: '2025-09-21T06:46:00', customer: 'Safri Bin Shuib' },
    { order: '1475', date: '2025-09-21T06:51:00', customer: 'MORDIATI BINTI WAKIS' },
    { order: '1476', date: '2025-09-21T07:02:00', customer: 'NURUL AIN BINTI PUWASA' }
  ];
  
  bronzeOrders.forEach(({ order, date, customer }) => {
    ['colostrum-p', 'colostrum-g', 'barley-best'].forEach(productId => {
      const productName = productId === 'colostrum-p' ? 'Ahad Colostrum P' : 
                         productId === 'colostrum-g' ? 'Ahad Colostrum G' : 'Ahad Barley Best';
      orders.push(createLogEntry(order, date, customer, productId, productName, stockLevels[productId], -1));
      stockLevels[productId] -= 1;
    });
  });
  
  // SILVER MEMBERSHIP ORDERS (4 orders - 2 of each)
  const silverOrders = [
    { order: '1363', date: '2025-03-18T09:34:00', customer: 'Shamsina Liza Binti Manaf' },
    { order: '1368', date: '2025-05-07T07:53:00', customer: 'ASZELAN BIN TOKININ' },
    { order: '1502', date: '2025-11-24T16:42:00', customer: 'Abdullah Bin Ishak' },
    { order: '1504', date: '2025-11-25T14:18:00', customer: 'NOR HAFIZA BINTI HAJI JAHARI' }
  ];
  
  silverOrders.forEach(({ order, date, customer }) => {
    ['colostrum-p', 'colostrum-g', 'barley-best'].forEach(productId => {
      const productName = productId === 'colostrum-p' ? 'Ahad Colostrum P' : 
                         productId === 'colostrum-g' ? 'Ahad Colostrum G' : 'Ahad Barley Best';
      orders.push(createLogEntry(order, date, customer, productId, productName, stockLevels[productId], -2));
      stockLevels[productId] -= 2;
    });
  });
  
  // INDIVIDUAL PRODUCT ORDERS (3 orders)
  // Order #1367 - Barley Best x8
  orders.push(createLogEntry('1367', '2025-04-27T01:26:00', 'Husaini Bin Abdullah', 
    'barley-best', 'Ahad Barley Best', stockLevels['barley-best'], -8));
  stockLevels['barley-best'] -= 8;
  
  // Order #1370 - Barley Best x4
  orders.push(createLogEntry('1370', '2025-05-15T10:03:00', 'Husaini Bin Abdullah', 
    'barley-best', 'Ahad Barley Best', stockLevels['barley-best'], -4));
  stockLevels['barley-best'] -= 4;
  
  // Order #1501 - Colostrum P x2 + Barley Best x4
  orders.push(createLogEntry('1501', '2025-11-16T17:26:00', 'Husaini Bin Abdullah', 
    'colostrum-p', 'Ahad Colostrum P', stockLevels['colostrum-p'], -2));
  stockLevels['colostrum-p'] -= 2;
  
  orders.push(createLogEntry('1501', '2025-11-16T17:26:00', 'Husaini Bin Abdullah', 
    'barley-best', 'Ahad Barley Best', stockLevels['barley-best'], -4));
  stockLevels['barley-best'] -= 4;
  
  // Final stock should be: Colostrum P: 914, Colostrum G: 916, Barley Best: 900
  
  return orders.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
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

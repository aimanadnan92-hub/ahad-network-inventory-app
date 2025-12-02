import { Product, ActivityLog, User } from '@/types/inventory';

// YOUR N8N WEBHOOK URL
const N8N_API_URL = 'https://n8n.ahader.cloud/webhook/get-inventory'; 

const STORAGE_KEYS = {
  PRODUCTS: 'ahad-products',
  ACTIVITY_LOG: 'ahad-activity-log',
  USERS: 'ahad-users',
  CURRENT_USER: 'ahad-current-user',
} as const;

// --- INITIAL DATA (The Base Stock) ---
const INITIAL_STOCK = {
  'colostrum-p': 1000,
  'colostrum-g': 1000,
  'barley-best': 1000
};

// Default products structure
const defaultProducts: Record<string, Product> = {
  'colostrum-p': {
    id: 'colostrum-p',
    name: 'Ahad Colostrum P',
    sku: 'ACP-001',
    stock: INITIAL_STOCK['colostrum-p'],
    costPrice: 37.00,
    retailPrice: 175.00,
    minAlert: 100,
    lastUpdated: new Date().toISOString(),
  },
  'colostrum-g': {
    id: 'colostrum-g',
    name: 'Ahad Colostrum G',
    sku: 'ACG-001',
    stock: INITIAL_STOCK['colostrum-g'],
    costPrice: 48.00,
    retailPrice: 150.00,
    minAlert: 100,
    lastUpdated: new Date().toISOString(),
  },
  'barley-best': {
    id: 'barley-best',
    name: 'Ahad Barley Best',
    sku: 'ABB-001',
    stock: INITIAL_STOCK['barley-best'],
    costPrice: 24.00,
    retailPrice: 135.00,
    minAlert: 100,
    lastUpdated: new Date().toISOString(),
  },
};

// --- OLD HARDCODED DATA (DO NOT DELETE) ---
// This function generates the historical 31 orders you manually entered
const generateProductionOrders = (): ActivityLog[] => {
  const orders: ActivityLog[] = [];
  let activityCounter = 1;
  
  const createLogEntry = (
    orderNumber: string,
    orderDate: string,
    customer: string,
    productId: string,
    productName: string,
    change: number
  ): ActivityLog => ({
    id: `activity-${String(activityCounter++).padStart(3, '0')}`,
    timestamp: new Date(orderDate).toISOString(),
    type: 'invoice',
    orderNumber,
    productUpdates: [{
      productId,
      before: 0, // Recalculated dynamically later
      after: 0,  // Recalculated dynamically later
      change
    }],
    userId: 'system',
    userName: 'System',
    notes: `${customer} - Order #${orderNumber}`
  });
  
  // GOLD MEMBERSHIP ORDERS
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
      orders.push(createLogEntry(order, date, customer, productId, productName, -5));
    });
  });
  
  // BRONZE MEMBERSHIP ORDERS
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
      orders.push(createLogEntry(order, date, customer, productId, productName, -1));
    });
  });
  
  // SILVER MEMBERSHIP ORDERS
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
      orders.push(createLogEntry(order, date, customer, productId, productName, -2));
    });
  });
  
  // INDIVIDUAL PRODUCT ORDERS
  orders.push(createLogEntry('1367', '2025-04-27T01:26:00', 'Husaini Bin Abdullah', 
    'barley-best', 'Ahad Barley Best', -8));
  
  orders.push(createLogEntry('1370', '2025-05-15T10:03:00', 'Husaini Bin Abdullah', 
    'barley-best', 'Ahad Barley Best', -4));
  
  orders.push(createLogEntry('1501', '2025-11-16T17:26:00', 'Husaini Bin Abdullah', 
    'colostrum-p', 'Ahad Colostrum P', -2));
  
  orders.push(createLogEntry('1501', '2025-11-16T17:26:00', 'Husaini Bin Abdullah', 
    'barley-best', 'Ahad Barley Best', -4));
  
  return orders;
};

// --- HELPER: Parse Google Sheet "Products" Column ---
const parseProductString = (productStr: string) => {
  if (!productStr) return [];
  
  const changes: { productId: string; change: number }[] = [];
  const items = productStr.split(',').map(s => s.trim());

  items.forEach(item => {
    const qtyMatch = item.match(/\(x(\d+)\)/);
    const qty = qtyMatch ? parseInt(qtyMatch[1]) : 1;
    const name = item.toLowerCase();

    if (name.includes('gold')) {
      changes.push({ productId: 'colostrum-p', change: -5 * qty });
      changes.push({ productId: 'colostrum-g', change: -5 * qty });
      changes.push({ productId: 'barley-best', change: -5 * qty });
    } else if (name.includes('silver')) {
      changes.push({ productId: 'colostrum-p', change: -2 * qty });
      changes.push({ productId: 'colostrum-g', change: -2 * qty });
      changes.push({ productId: 'barley-best', change: -2 * qty });
    } else if (name.includes('bronze')) {
      changes.push({ productId: 'colostrum-p', change: -1 * qty });
      changes.push({ productId: 'colostrum-g', change: -1 * qty });
      changes.push({ productId: 'barley-best', change: -1 * qty });
    } else if (name.includes('barley')) {
      changes.push({ productId: 'barley-best', change: -1 * qty });
    } else if (name.includes('colostrum p')) {
      changes.push({ productId: 'colostrum-p', change: -1 * qty });
    } else if (name.includes('colostrum g')) {
      changes.push({ productId: 'colostrum-g', change: -1 * qty });
    }
  });

  return changes;
};

// --- SYNC FUNCTION (Combine Old Data + New Google Sheets Data) ---
export const syncWithGoogleSheets = async () => {
  console.log('Syncing with Google Sheets...');
  
  try {
    const response = await fetch(N8N_API_URL);
    if (!response.ok) throw new Error('Failed to fetch from n8n');
    
    const sheetData = await response.json();
    console.log('Sheet Data Received:', sheetData);
    
    // 1. Get Old Hardcoded Logs
    const oldLogs = generateProductionOrders();

    // 2. Convert New Sheet Rows to Logs
    const newLogs: ActivityLog[] = sheetData.map((row: any, index: number) => {
      const status = row['Status']?.toLowerCase() || '';
      const isPaid = status === 'processing' || status === 'completed';
      
      // IMPORTANT: Skip orders if they already exist in oldLogs (avoid double counting)
      const orderId = row['Order ID']?.toString();
      const existsInOld = oldLogs.some(log => log.orderNumber === orderId);
      
      if (existsInOld) return null; // Skip duplicate old orders found in sheet

      const changes = isPaid ? parseProductString(row['Products']) : [];

      return {
        id: `sheet-${orderId || index}`,
        timestamp: row['Date'] || new Date().toISOString(),
        type: 'invoice',
        orderNumber: orderId,
        productUpdates: changes.map(c => ({
          productId: c.productId,
          before: 0,
          after: 0,
          change: c.change
        })),
        userId: 'system',
        userName: row['Customer'] || 'WooCommerce',
        notes: `${row['Status']} - ${row['Products']}`
      };
    }).filter((log: any) => log !== null); // Remove nulls

    // 3. Combine All Logs (Old + New)
    const allLogs = [...oldLogs, ...newLogs];

    // 4. Recalculate Stock from Scratch (1000 base)
    const newProducts = JSON.parse(JSON.stringify(defaultProducts));
    
    // Sort logs oldest -> newest
    const sortedLogs = allLogs.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    sortedLogs.forEach(log => {
      log.productUpdates.forEach(update => {
        if (newProducts[update.productId]) {
          update.before = newProducts[update.productId].stock;
          newProducts[update.productId].stock += update.change;
          update.after = newProducts[update.productId].stock;
          newProducts[update.productId].lastUpdated = log.timestamp;
        }
      });
    });

    // Save to Cache
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, JSON.stringify(sortedLogs.reverse())); 
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(newProducts));
    
    return { products: newProducts, logs: sortedLogs.reverse() };

  } catch (error) {
    console.error('Sync Error:', error);
    return null;
  }
};

// --- GETTERS ---
export const getProducts = (): Record<string, Product> => {
  const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
  return stored ? JSON.parse(stored) : defaultProducts;
};

export const getActivityLog = (): ActivityLog[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG);
  // If nothing in cache, load at least the old hardcoded data
  return stored ? JSON.parse(stored) : generateProductionOrders().reverse();
};

// --- USERS ---
export const getUsers = (): User[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.USERS);
  const defaultUsers: User[] = [
    { id: 'user-001', email: 'admin@ahadnetwork.com', passwordHash: 'AhadNetwork2025!', role: 'admin', name: 'Admin User', createdAt: new Date().toISOString() },
    { id: 'user-002', email: 'aiman.adnan92@gmail.com', passwordHash: 'Staff123!', role: 'staff', name: 'Aiman', createdAt: new Date().toISOString() },
    { id: 'user-003', email: 'farahaimannnn@gmail.com', passwordHash: 'Viewer123!', role: 'viewer', name: 'Farah', createdAt: new Date().toISOString() },
    { id: 'user-004', email: 's.anuar1990@gmail.com', passwordHash: 'Viewer123!', role: 'viewer', name: 'Anuar', createdAt: new Date().toISOString() }
  ];
  if (!stored) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
  return stored ? JSON.parse(stored) : defaultUsers;
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

export const saveProducts = (products: Record<string, Product>) => {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
};

export const updateProductStock = async (productId: string, newStock: number) => {
  const products = getProducts();
  if (products[productId]) {
    products[productId].stock = newStock;
    products[productId].lastUpdated = new Date().toISOString();
    saveProducts(products);
  }
};

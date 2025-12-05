import { Product, ActivityLog, User } from '@/types/inventory';

// --- API CONFIGURATION ---
const N8N_SALES_URL = 'https://n8n.ahader.cloud/webhook/get-inventory'; 
const N8N_ADJUSTMENTS_READ_URL = 'https://n8n.ahader.cloud/webhook/get-adjustments';
const N8N_ADJUSTMENTS_WRITE_URL = 'https://n8n.ahader.cloud/webhook/post-adjustment';

const STORAGE_KEYS = {
  PRODUCTS: 'ahad-products',
  ACTIVITY_LOG: 'ahad-activity-log',
  USERS: 'ahad-users',
  CURRENT_USER: 'ahad-current-user',
} as const;

// --- INITIAL DATA (Base Stock) ---
const INITIAL_STOCK = {
  'colostrum-p': 1000,
  'colostrum-g': 1000,
  'barley-best': 1000
};

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

// --- HELPER: Parse Dates Robustly ---
const safeDate = (dateStr: string | undefined): number => {
  if (!dateStr) return 0;
  let timestamp = new Date(dateStr).getTime();
  if (isNaN(timestamp)) {
    // Handle "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DD" often returned by Sheets
    timestamp = new Date(dateStr.replace(' ', 'T')).getTime();
  }
  return isNaN(timestamp) ? 0 : timestamp;
};

// --- HELPER: Normalize Row Keys (The Fix for "Missing" Data) ---
// This flattens n8n data (removes .json wrapper) and makes keys lowercase for easy lookup
const normalizeRow = (row: any) => {
  if (!row) return {};
  // If n8n wraps data in a 'json' property, unwrap it
  const data = row.json ? row.json : row;
  
  // Create a new object with lowercase keys (e.g. 'Product' -> 'product')
  const normalized: Record<string, any> = {};
  Object.keys(data).forEach(key => {
    normalized[key.toLowerCase()] = data[key];
  });
  return normalized;
};

// --- HELPER: Safe Fetch with Timeout ---
const fetchSafe = async (url: string) => {
  try {
    console.log(`Fetching: ${url}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const json = await response.json();
      // Ensure we always return an array
      return Array.isArray(json) ? json : []; 
    }
    console.warn(`API Error ${url}: ${response.statusText}`);
    return [];
  } catch (error) {
    console.warn(`Network Error/Timeout: ${url}`, error);
    return [];
  }
};

// --- HELPER: Generate Hardcoded History ---
const generateProductionOrders = (): ActivityLog[] => {
  const orders: ActivityLog[] = [];
  let activityCounter = 1;
  
  const createLogEntry = (
    orderNumber: string,
    orderDate: string,
    customer: string,
    productId: string,
    change: number
  ): ActivityLog => ({
    id: `activity-hist-${String(activityCounter++).padStart(3, '0')}`,
    timestamp: new Date(orderDate).toISOString(),
    type: 'invoice',
    orderNumber,
    productUpdates: [{
      productId,
      before: 0,
      after: 0,
      change
    }],
    userId: 'system',
    userName: 'System',
    notes: `${customer} - Order #${orderNumber}`
  });
  
  // --- HARDCODED HISTORICAL DATA ---
  ['colostrum-p', 'colostrum-g', 'barley-best'].forEach(pid => 
    orders.push(createLogEntry('1504', '2025-11-28T10:00:00Z', 'Naurawm GS/Riziman', pid, -2))
  );
  ['colostrum-p', 'colostrum-g', 'barley-best'].forEach(pid => 
    orders.push(createLogEntry('1502', '2025-11-20T10:00:00Z', 'Abdullah Ishak', pid, -2))
  );
  orders.push(createLogEntry('1501', '2025-11-16T17:26:00Z', 'Husaini Bin Abdullah', 'colostrum-p', -2));
  orders.push(createLogEntry('1501', '2025-11-16T17:26:00Z', 'Husaini Bin Abdullah', 'barley-best', -4));
  orders.push(createLogEntry('1370', '2025-05-15T10:00:00Z', 'Husaini Bin Abdullah', 'barley-best', -4));
  orders.push(createLogEntry('1367', '2025-04-27T10:00:00Z', 'Husaini Bin Abdullah', 'barley-best', -8));

  // Legacy Orders
  ['1437', '150', '151', '152', '154', '155', '157', '158', '159', '160', '161', '1018', '1275'].forEach(order => {
    ['colostrum-p', 'colostrum-g', 'barley-best'].forEach(pid => orders.push(createLogEntry(order, '2024-10-24T10:00:00Z', 'Historical Customer', pid, -5)));
  });
  ['1363', '1368'].forEach(order => {
    ['colostrum-p', 'colostrum-g', 'barley-best'].forEach(pid => orders.push(createLogEntry(order, '2025-01-18T10:00:00Z', 'Historical Customer', pid, -2)));
  });
  ['1227', '1310', '1351', '1352', '1373', '1471', '1472', '1473', '1474', '1475', '1476'].forEach(order => {
    ['colostrum-p', 'colostrum-g', 'barley-best'].forEach(pid => orders.push(createLogEntry(order, '2025-02-07T10:00:00Z', 'Historical Customer', pid, -1)));
  });

  return orders;
};

// --- HELPER: Parse Product Strings ---
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

// --- SYNC FUNCTION ---
export const syncWithGoogleSheets = async () => {
  console.log('Syncing data...');
  
  const historyLogs = generateProductionOrders();
  const salesData = await fetchSafe(N8N_SALES_URL);
  const adjustmentsData = await fetchSafe(N8N_ADJUSTMENTS_READ_URL);

  const validSalesData = Array.isArray(salesData) ? salesData : [];
  const validAdjustmentsData = Array.isArray(adjustmentsData) ? adjustmentsData : [];

  // --- SALES PROCESSING ---
  const salesLogs: ActivityLog[] = validSalesData.map((rawRow: any, index: number) => {
    const row = normalizeRow(rawRow); // NORMALIZE
    if (!row.status) return null;

    const status = row.status?.toLowerCase() || '';
    const isPaid = status === 'processing' || status === 'completed';
    // Handle 'Order ID' vs 'order id' (normalizeRow handles basic keys, but 'Order ID' has a space)
    const orderId = (rawRow['Order ID'] || row['order id'] || row.id)?.toString();
    
    if (historyLogs.some(log => log.orderNumber === orderId)) return null;

    const changes = isPaid ? parseProductString(row.products) : [];
    if (changes.length === 0) return null;

    return {
      id: `sale-${orderId || index}`,
      timestamp: row.date ? row.date : new Date().toISOString(),
      type: 'invoice',
      orderNumber: orderId,
      productUpdates: changes.map(c => ({
        productId: c.productId,
        before: 0, after: 0, change: c.change
      })),
      userId: 'system',
      userName: row.customer || 'System',
      notes: `${row.status} - ${row.products}`
    };
  }).filter((log: any) => log !== null);

  // --- ADJUSTMENTS PROCESSING (FIXED) ---
  const adjustmentLogs: ActivityLog[] = validAdjustmentsData.map((rawRow: any, index: number) => {
    const row = normalizeRow(rawRow); // NORMALIZE: Converts 'Product' to 'product', unwraps .json
    
    if (!row.product && !row.type) return null;

    const pName = (row.product || '').toLowerCase();
    const type = (row.type || 'manual').toLowerCase();
    const qty = parseInt(row.quantity || '0');
    const rowDate = row.date;
    const rowReason = row.reason || 'Manual Adjustment';

    let pid = '';
    
    if (pName.includes('colostrum p')) pid = 'colostrum-p';
    else if (pName.includes('colostrum g')) pid = 'colostrum-g';
    else if (pName.includes('barley')) pid = 'barley-best';
    else if (pName.includes('all')) pid = 'all'; 

    let multiplier = 1;
    if (['remove', 'temporary-out', 'damaged', 'missing', 'expired', 'sample-demo'].includes(type)) {
      multiplier = -1;
    }

    const updates = [];
    if (pid === 'all') {
      ['colostrum-p', 'colostrum-g', 'barley-best'].forEach(id => {
        updates.push({ productId: id, before: 0, after: 0, change: qty * multiplier });
      });
    } else if (pid) {
      updates.push({ productId: pid, before: 0, after: 0, change: qty * multiplier });
    }

    if (updates.length === 0) return null;

    return {
      id: `adj-${index}-${Date.now()}`, // Unique ID
      timestamp: rowDate ? rowDate : new Date().toISOString(),
      type: type as any,
      orderNumber: null,
      productUpdates: updates,
      userId: 'manual',
      userName: 'Admin',
      notes: rowReason
    };
  }).filter((log: any) => log !== null);

  // MERGE & SORT
  const allLogs = [...historyLogs, ...salesLogs, ...adjustmentLogs];
  
  const sortedLogs = allLogs.sort((a, b) => 
    safeDate(a.timestamp) - safeDate(b.timestamp)
  );

  // CALCULATE RUNNING TOTAL
  const newProducts = JSON.parse(JSON.stringify(defaultProducts));

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

  // SAVE
  localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, JSON.stringify(sortedLogs.reverse())); 
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(newProducts));
  
  return { products: newProducts, logs: sortedLogs };
};

// --- WRITE ACTION ---
export const writeAdjustmentToGoogleSheets = async (data: any) => {
  try {
    const response = await fetch(N8N_ADJUSTMENTS_WRITE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to write adjustment:', error);
    return false;
  }
};

// --- GETTERS & HELPERS ---
export const getProducts = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || JSON.stringify(defaultProducts));
export const getActivityLog = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG);
  try { return stored ? JSON.parse(stored) : []; } catch (e) { return []; }
};
export const getUsers = () => {
  const users = [
    { id: 'user-001', email: 'admin@ahadnetwork.com', passwordHash: 'AhadNetwork2025!', role: 'admin', name: 'Admin User', createdAt: new Date().toISOString() },
    { id: 'user-002', email: 'aiman.adnan92@gmail.com', passwordHash: 'Staff123!', role: 'staff', name: 'Aiman', createdAt: new Date().toISOString() },
    { id: 'user-003', email: 'farahaimannnn@gmail.com', passwordHash: 'Viewer123!', role: 'viewer', name: 'Farah', createdAt: new Date().toISOString() },
    { id: 'user-004', email: 's.anuar1990@gmail.com', passwordHash: 'Viewer123!', role: 'viewer', name: 'Anuar', createdAt: new Date().toISOString() }
  ];
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  return users;
};
export const saveUsers = (users: User[]) => localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
export const updateUserLastLogin = (userId: string) => {}; 
export const getCurrentUser = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'null');
export const setCurrentUser = (user: User | null) => user ? localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user)) : localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
export const updateProductStock = async (productId: string, newStock: number) => { /* Deprecated */ };

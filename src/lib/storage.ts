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

// --- HELPER: Generate Hardcoded History ---
// These are your PRE-Google Sheet orders. 
// IMPORTANT: Ensure these Order IDs do NOT exist in your Google Sheet rows, or they will be skipped.
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
      before: 0,
      after: 0,
      change
    }],
    userId: 'system',
    userName: 'System',
    notes: `${customer} - Order #${orderNumber}`
  });
  
  // Gold Orders
  ['1437', '150', '151', '152', '154', '155', '157', '158', '159', '160', '161', '1018', '1275'].forEach(order => {
    ['colostrum-p', 'colostrum-g', 'barley-best'].forEach(pid => orders.push(createLogEntry(order, '2024-10-24T00:00:00Z', 'Historical Customer', pid, '', -5)));
  });
  // Silver Orders
  ['1363', '1368', '1502', '1504'].forEach(order => {
    ['colostrum-p', 'colostrum-g', 'barley-best'].forEach(pid => orders.push(createLogEntry(order, '2025-03-18T00:00:00Z', 'Historical Customer', pid, '', -2)));
  });
  // Bronze Orders
  ['1227', '1310', '1351', '1352', '1373', '1471', '1472', '1473', '1474', '1475', '1476'].forEach(order => {
    ['colostrum-p', 'colostrum-g', 'barley-best'].forEach(pid => orders.push(createLogEntry(order, '2025-02-07T00:00:00Z', 'Historical Customer', pid, '', -1)));
  });
  // Individual Orders
  orders.push(createLogEntry('1367', '2025-04-27T00:00:00Z', 'Husaini Bin Abdullah', 'barley-best', '', -8));
  orders.push(createLogEntry('1370', '2025-05-15T00:00:00Z', 'Husaini Bin Abdullah', 'barley-best', '', -4));
  orders.push(createLogEntry('1501', '2025-11-16T00:00:00Z', 'Husaini Bin Abdullah', 'colostrum-p', '', -2));
  orders.push(createLogEntry('1501', '2025-11-16T00:00:00Z', 'Husaini Bin Abdullah', 'barley-best', '', -4));

  return orders;
};

// --- HELPER: Parse Product Strings (Robust Matching) ---
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

// --- SYNC FUNCTION (The Brain) ---
export const syncWithGoogleSheets = async () => {
  console.log('Syncing data...');
  
  try {
    // 1. Fetch Sales Data
    const salesResponse = await fetch(N8N_SALES_URL);
    const salesData = salesResponse.ok ? await salesResponse.json() : [];

    // 2. Fetch Adjustments Data
    const adjustmentsResponse = await fetch(N8N_ADJUSTMENTS_READ_URL);
    const adjustmentsData = adjustmentsResponse.ok ? await adjustmentsResponse.json() : [];

    // 3. Get Hardcoded History
    const historyLogs = generateProductionOrders();

    // 4. Process Sales Logs (From Sheet1)
    const salesLogs: ActivityLog[] = salesData.map((row: any, index: number) => {
      const status = row['Status']?.toLowerCase() || '';
      const isPaid = status === 'processing' || status === 'completed';
      const orderId = row['Order ID']?.toString();
      
      // Skip duplicate orders that are already hardcoded
      if (historyLogs.some(log => log.orderNumber === orderId)) return null;

      const changes = isPaid ? parseProductString(row['Products']) : [];

      return {
        id: `sale-${orderId || index}`,
        timestamp: row['Date'] || new Date().toISOString(),
        type: 'invoice',
        orderNumber: orderId,
        productUpdates: changes.map(c => ({
          productId: c.productId,
          before: 0, after: 0, change: c.change
        })),
        userId: 'system',
        userName: row['Customer'] || 'System',
        notes: `${row['Status']} - ${row['Products']}`
      };
    }).filter((log: any) => log !== null);

    // 5. Process Manual Adjustment Logs (From Adjustments Tab)
    const adjustmentLogs: ActivityLog[] = adjustmentsData.map((row: any, index: number) => {
      let pid = '';
      const pName = (row['Product'] || '').toLowerCase();
      
      // Improved matching for Manual Adjustments
      if (pName.includes('colostrum p')) pid = 'colostrum-p';
      else if (pName.includes('colostrum g')) pid = 'colostrum-g';
      else if (pName.includes('barley')) pid = 'barley-best';
      else if (pName.includes('all')) pid = 'all'; 

      const qty = parseInt(row['Quantity'] || '0');
      const type = row['Type'] || 'manual';
      
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

      return {
        id: `adj-${index}`,
        timestamp: row['Date'] ? new Date(row['Date']).toISOString() : new Date().toISOString(),
        type: type as any,
        orderNumber: null,
        productUpdates: updates,
        userId: 'manual',
        userName: 'Admin',
        notes: row['Reason'] || 'Manual Adjustment'
      };
    });

    // 6. MERGE & SORT (Crucial Step for correct history)
    // We combine everything into one big timeline
    const allLogs = [...historyLogs, ...salesLogs, ...adjustmentLogs];
    
    // Sort strictly by Date (Oldest first) so calculations flow forward correctly
    const sortedLogs = allLogs.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // 7. CALCULATE RUNNING TOTAL
    // Start from 1000 and apply changes chronologically
    const newProducts = JSON.parse(JSON.stringify(defaultProducts));

    sortedLogs.forEach(log => {
      log.productUpdates.forEach(update => {
        if (newProducts[update.productId]) {
          // Record "Stock Before" for this log
          update.before = newProducts[update.productId].stock;
          
          // Apply Change
          newProducts[update.productId].stock += update.change;
          
          // Record "Stock After" for this log
          update.after = newProducts[update.productId].stock;
          
          // Update "Last Modified" date on product
          newProducts[update.productId].lastUpdated = log.timestamp;
        }
      });
    });

    // 8. SAVE (Reverse logs so Newest is at top for UI)
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, JSON.stringify(sortedLogs.reverse())); 
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(newProducts));
    
    console.log('Final Products State:', newProducts);
    return { products: newProducts, logs: sortedLogs }; // Logs are already reversed above

  } catch (error) {
    console.error('Sync Error:', error);
    return null;
  }
};

// --- WRITE ACTION (Send to n8n) ---
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

// Ensure we always return an array, even if cache is empty/corrupt
export const getActivityLog = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG);
  try {
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
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
export const updateProductStock = async (productId: string, newStock: number) => { /* Deprecated by writeAdjustment */ };

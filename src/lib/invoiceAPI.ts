import { getProducts, updateProductStock, getActivityLog, getCurrentUser } from './storage';

interface InvoiceRequest {
  orderNumber: string;
  orderDate: string;
  customer: {
    name: string;
    email?: string;
    phone?: string;
  };
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  paymentMethod: string;
}

interface InvoiceResponse {
  success: boolean;
  message: string;
  orderNumber: string;
  customer?: string;
  timestamp?: string;
  stockUpdates?: Array<{
    product: string;
    productId: string;
    before: number;
    after: number;
    change: number;
  }>;
  error?: string;
  availableStock?: Record<string, number>;
  processedAt?: string;
}

export const processInvoice = async (request: InvoiceRequest): Promise<InvoiceResponse> => {
  const products = getProducts();
  const activityLog = getActivityLog();
  const user = getCurrentUser();
  
  // Check for duplicate order
  const orderExists = activityLog.some(log => log.orderNumber === request.orderNumber);
  if (orderExists) {
    const existingOrder = activityLog.find(log => log.orderNumber === request.orderNumber);
    return {
      success: false,
      error: 'duplicate_order',
      message: `Order #${request.orderNumber} has already been processed`,
      orderNumber: request.orderNumber,
      processedAt: existingOrder?.timestamp,
    };
  }
  
  let deductions: Record<string, number> = {};
  
  // Process all items in the order
  for (const item of request.items) {
    const productName = item.productName.toLowerCase();
    
    // Detect package type
    if (productName.includes('gold')) {
      deductions['colostrum-p'] = (deductions['colostrum-p'] || 0) + 5;
      deductions['colostrum-g'] = (deductions['colostrum-g'] || 0) + 5;
      deductions['barley-best'] = (deductions['barley-best'] || 0) + 5;
    } else if (productName.includes('silver')) {
      deductions['colostrum-p'] = (deductions['colostrum-p'] || 0) + 2;
      deductions['colostrum-g'] = (deductions['colostrum-g'] || 0) + 2;
      deductions['barley-best'] = (deductions['barley-best'] || 0) + 2;
    } else if (productName.includes('bronze')) {
      deductions['colostrum-p'] = (deductions['colostrum-p'] || 0) + 1;
      deductions['colostrum-g'] = (deductions['colostrum-g'] || 0) + 1;
      deductions['barley-best'] = (deductions['barley-best'] || 0) + 1;
    } else {
      // Individual product
      const productId = Object.keys(products).find(id => 
        products[id].name.toLowerCase().includes(productName)
      );
      
      if (!productId) {
        return {
          success: false,
          error: 'product_not_found',
          message: `Product not found: ${item.productName}`,
          orderNumber: request.orderNumber,
        };
      }
      
      deductions[productId] = (deductions[productId] || 0) + item.quantity;
    }
  }
  
  // Validate stock availability
  const availableStock: Record<string, number> = {};
  for (const [productId, qty] of Object.entries(deductions)) {
    const product = products[productId];
    availableStock[product.name] = product.stock;
    
    if (product.stock < qty) {
      return {
        success: false,
        error: 'insufficient_stock',
        message: `Cannot process order #${request.orderNumber}. ${product.name} only has ${product.stock} units available, need ${qty}.`,
        orderNumber: request.orderNumber,
        availableStock,
      };
    }
  }
  
  // Update stock
  const stockUpdates = [];
  for (const [productId, qty] of Object.entries(deductions)) {
    const product = products[productId];
    const before = product.stock;
    const after = before - qty;
    
    updateProductStock(productId, after);
    
    stockUpdates.push({
      product: product.name,
      productId,
      before,
      after,
      change: -qty,
    });
  }
  
  // Log activity - create separate entries for each product
  const timestamp = new Date(request.orderDate || new Date()).toISOString();
  const logs = getActivityLog();
  
  for (const update of stockUpdates) {
    const newLog = {
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      type: 'invoice' as const,
      orderNumber: request.orderNumber,
      productUpdates: [{
        productId: update.productId,
        before: update.before,
        after: update.after,
        change: update.change,
      }],
      userId: user?.id || 'system',
      userName: user?.name || 'System',
      notes: `${request.customer.name} - Order #${request.orderNumber}`,
    };
    logs.push(newLog);
  }
  
  localStorage.setItem('ahad-activity-log', JSON.stringify(logs));
  
  return {
    success: true,
    message: `Order #${request.orderNumber} processed successfully`,
    orderNumber: request.orderNumber,
    customer: request.customer.name,
    timestamp,
    stockUpdates,
  };
};

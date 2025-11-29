import { getProducts, updateProductStock, addActivityLog, getCurrentUser } from './storage';

interface InvoiceRequest {
  orderNumber: string;
  orderDate: string;
  productName: string;
  quantity: number;
  total: number;
  paymentMethod: string;
  customer: {
    name: string;
    address: string;
  };
}

interface InvoiceResponse {
  success: boolean;
  message: string;
  orderNumber: string;
  stockUpdates: Record<string, { before: number; after: number }>;
}

export const processInvoice = async (request: InvoiceRequest): Promise<InvoiceResponse> => {
  const products = getProducts();
  const user = getCurrentUser();
  const productName = request.productName.toLowerCase();
  
  let deductions: Record<string, number> = {};
  
  // Detect package type
  if (productName.includes('bronze')) {
    deductions = {
      'colostrum-p': 1,
      'colostrum-g': 1,
      'barley-best': 1,
    };
  } else if (productName.includes('silver')) {
    deductions = {
      'colostrum-p': 2,
      'colostrum-g': 2,
      'barley-best': 2,
    };
  } else if (productName.includes('gold')) {
    deductions = {
      'colostrum-p': 5,
      'colostrum-g': 5,
      'barley-best': 5,
    };
  } else {
    // Individual product
    const productId = Object.keys(products).find(id => 
      products[id].name.toLowerCase().includes(productName)
    );
    
    if (!productId) {
      return {
        success: false,
        message: 'Product not found',
        orderNumber: request.orderNumber,
        stockUpdates: {},
      };
    }
    
    deductions[productId] = request.quantity;
  }
  
  // Validate stock availability
  const stockUpdates: Record<string, { before: number; after: number }> = {};
  
  for (const [productId, qty] of Object.entries(deductions)) {
    const product = products[productId];
    if (product.stock < qty) {
      return {
        success: false,
        message: `Insufficient stock for ${product.name}`,
        orderNumber: request.orderNumber,
        stockUpdates: {},
      };
    }
    
    stockUpdates[product.name] = {
      before: product.stock,
      after: product.stock - qty,
    };
  }
  
  // Update stock
  const productUpdates = [];
  for (const [productId, qty] of Object.entries(deductions)) {
    const product = products[productId];
    const before = product.stock;
    const after = before - qty;
    
    updateProductStock(productId, after);
    
    productUpdates.push({
      productId,
      before,
      after,
      change: -qty,
    });
  }
  
  // Log activity
  addActivityLog({
    type: 'invoice',
    orderNumber: request.orderNumber,
    productUpdates,
    userId: user?.id || 'system',
    userName: user?.name || 'System',
    notes: `${request.productName} - Order #${request.orderNumber} - ${request.customer.name}`,
  });
  
  return {
    success: true,
    message: 'Inventory updated successfully',
    orderNumber: request.orderNumber,
    stockUpdates,
  };
};

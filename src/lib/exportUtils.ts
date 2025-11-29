import { getProducts, getActivityLog } from './storage';
import { format } from 'date-fns';

export const exportToCSV = () => {
  const products = getProducts();
  const activities = getActivityLog();

  // Export inventory
  const inventoryHeaders = ['Product Name', 'SKU', 'Current Stock', 'Cost Price (RM)', 'Retail Price (RM)', 'Total Value (RM)', 'Last Updated'];
  const inventoryRows = Object.values(products).map(product => [
    product.name,
    product.sku,
    product.stock.toString(),
    product.costPrice.toFixed(2),
    product.retailPrice.toFixed(2),
    (product.stock * product.retailPrice).toFixed(2),
    format(new Date(product.lastUpdated), 'yyyy-MM-dd HH:mm:ss'),
  ]);

  const inventoryCSV = [inventoryHeaders, ...inventoryRows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  // Export activity log
  const activityHeaders = ['Date/Time', 'Transaction ID', 'Type', 'Order Number', 'Products', 'Quantity Changes', 'User', 'Notes'];
  const activityRows = activities.map(activity => [
    format(new Date(activity.timestamp), 'yyyy-MM-dd HH:mm:ss'),
    activity.id,
    activity.type,
    activity.orderNumber || 'N/A',
    activity.productUpdates.map(u => products[u.productId]?.name || u.productId).join('; '),
    activity.productUpdates.map(u => `${u.change > 0 ? '+' : ''}${u.change}`).join('; '),
    activity.userName,
    activity.notes,
  ]);

  const activityCSV = [activityHeaders, ...activityRows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  // Download inventory CSV
  const inventoryBlob = new Blob([inventoryCSV], { type: 'text/csv' });
  const inventoryUrl = window.URL.createObjectURL(inventoryBlob);
  const inventoryLink = document.createElement('a');
  inventoryLink.href = inventoryUrl;
  inventoryLink.download = `ahad-inventory-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  inventoryLink.click();

  // Download activity log CSV
  setTimeout(() => {
    const activityBlob = new Blob([activityCSV], { type: 'text/csv' });
    const activityUrl = window.URL.createObjectURL(activityBlob);
    const activityLink = document.createElement('a');
    activityLink.href = activityUrl;
    activityLink.download = `ahad-activity-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    activityLink.click();
  }, 100);

  return { success: true };
};

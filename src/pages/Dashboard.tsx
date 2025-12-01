import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getProducts, getActivityLog } from '@/lib/storage';
import { Package as PackageType } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import PackageCalculator from '@/components/PackageCalculator';
import ActivityFeed from '@/components/ActivityFeed';
import ManualAdjustmentModal from '@/components/ManualAdjustmentModal';
import ExportSheetsDialog from '@/components/ExportSheetsDialog';
import { Plus, RefreshCw, FileSpreadsheet, Package } from 'lucide-react';

const PACKAGES: PackageType[] = [
  { type: 'bronze', name: 'Bronze Package', multiplier: 1, price: 775, icon: '🥉' },
  { type: 'silver', name: 'Silver Package', multiplier: 2, price: 1350, icon: '🥈' },
  { type: 'gold', name: 'Gold Package', multiplier: 5, price: 2930, icon: '🥇' },
];

const Dashboard = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [products, setProducts] = useState(getProducts());
  const [activities, setActivities] = useState(getActivityLog());
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const refreshData = () => {
    setProducts(getProducts());
    setActivities(getActivityLog());
  };

  // Calculate stats - count unique orders only
  const uniqueOrders = [...new Set(
    activities
      .filter(a => a.type === 'invoice' && a.orderNumber)
      .map(a => a.orderNumber)
  )];
  const totalOrders = uniqueOrders.length;
  
  // Count orders by package type
  const ordersByPackage = uniqueOrders.reduce((acc, orderNum) => {
    const orderActivities = activities.filter(a => a.orderNumber === orderNum);
    if (orderActivities.length === 0) return acc;
    
    // Check quantity deducted to determine package type
    const firstActivity = orderActivities[0];
    const change = Math.abs(firstActivity.productUpdates[0]?.change || 0);
    
    if (change === 5) acc.gold++;
    else if (change === 2) acc.silver++;
    else if (change === 1 && orderActivities.length === 3) acc.bronze++;
    else acc.individual++;
    
    return acc;
  }, { gold: 0, silver: 0, bronze: 0, individual: 0 });
  
  const thisMonth = uniqueOrders.filter(orderNum => {
    const orderActivity = activities.find(a => a.orderNumber === orderNum);
    if (!orderActivity) return false;
    const activityDate = new Date(orderActivity.timestamp);
    const now = new Date();
    return activityDate.getMonth() === now.getMonth() && 
           activityDate.getFullYear() === now.getFullYear();
  }).length;
  
  const thisWeek = uniqueOrders.filter(orderNum => {
    const orderActivity = activities.find(a => a.orderNumber === orderNum);
    if (!orderActivity) return false;
    const activityDate = new Date(orderActivity.timestamp);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return activityDate >= weekAgo;
  }).length;

  const totalValue = Object.values(products).reduce(
    (sum, p) => sum + (p.stock * p.retailPrice), 0
  );

  useEffect(() => {
    refreshData();
  }, []);

  // Calculate available packages
  const productArray = Object.values(products);
  const minStock = Math.min(...productArray.map(p => p.stock));
  
  const availableSets = {
    bronze: minStock,
    silver: Math.floor(minStock / 2),
    gold: Math.floor(minStock / 5),
  };

  const canEdit = user?.role === 'admin' || user?.role === 'staff';

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 rounded-lg border bg-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Total Orders</span>
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div className="text-3xl font-bold">{totalOrders}</div>
          <p className="text-xs text-muted-foreground mt-1">All time</p>
          <div className="mt-3 pt-3 border-t space-y-1">
            <div className="text-xs text-muted-foreground">Breakdown:</div>
            <div className="text-xs space-y-0.5">
              <div className="flex items-center gap-1">
                <span>🥇</span>
                <span>Gold: {ordersByPackage.gold} orders</span>
              </div>
              <div className="flex items-center gap-1">
                <span>🥈</span>
                <span>Silver: {ordersByPackage.silver} orders</span>
              </div>
              <div className="flex items-center gap-1">
                <span>🥉</span>
                <span>Bronze: {ordersByPackage.bronze} orders</span>
              </div>
              <div className="flex items-center gap-1">
                <span>📦</span>
                <span>Individual: {ordersByPackage.individual} orders</span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 rounded-lg border bg-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">This Month</span>
            <FileSpreadsheet className="h-5 w-5 text-primary" />
          </div>
          <div className="text-3xl font-bold">{thisMonth}</div>
          <p className="text-xs text-muted-foreground mt-1">November 2025</p>
        </div>
        <div className="p-6 rounded-lg border bg-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">This Week</span>
            <RefreshCw className="h-5 w-5 text-primary" />
          </div>
          <div className="text-3xl font-bold">{thisWeek}</div>
          <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
        </div>
        <div className="p-6 rounded-lg border bg-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Inventory Value</span>
            <Plus className="h-5 w-5 text-primary" />
          </div>
          <div className="text-3xl font-bold">RM {totalValue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">Current retail value</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {canEdit && (
          <Button onClick={() => setIsAdjustmentModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Manual Adjustment
          </Button>
        )}
        <Button variant="outline" onClick={refreshData} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
        <Button variant="outline" onClick={() => setIsExportDialogOpen(true)} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Export to Sheets
        </Button>
      </div>

      {/* Product Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Current Stock</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {productArray.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      {/* Package Calculator */}
      <PackageCalculator packages={PACKAGES} availableSets={availableSets} />

      {/* Activity Feed - Sort by newest first */}
      <ActivityFeed 
        activities={[...activities].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )} 
        limit={10} 
      />

      {/* Manual Adjustment Modal */}
      <ManualAdjustmentModal
        open={isAdjustmentModalOpen}
        onOpenChange={setIsAdjustmentModalOpen}
        onSuccess={refreshData}
      />

      {/* Export Dialog */}
      <ExportSheetsDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
      />
    </div>
  );
};

export default Dashboard;

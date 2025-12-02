import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getProducts, getActivityLog, syncWithGoogleSheets } from '@/lib/storage';
import { Package as PackageType } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import PackageCalculator from '@/components/PackageCalculator';
import ActivityFeed from '@/components/ActivityFeed';
import ManualAdjustmentModal from '@/components/ManualAdjustmentModal';
import ExportSheetsDialog from '@/components/ExportSheetsDialog';
import { Plus, RefreshCw, FileSpreadsheet, Package } from 'lucide-react';
import { toast } from 'sonner';

const PACKAGES: PackageType[] = [
  { type: 'bronze', name: 'Bronze Package', multiplier: 1, price: 775, icon: '🥉' },
  { type: 'silver', name: 'Silver Package', multiplier: 2, price: 1350, icon: '🥈' },
  { type: 'gold', name: 'Gold Package', multiplier: 5, price: 2930, icon: '🥇' },
];

const Dashboard = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState(getProducts());
  const [activities, setActivities] = useState(getActivityLog());
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync Data Function
  const refreshData = async () => {
    setIsSyncing(true);
    
    // 1. Load local immediately (fast)
    setProducts(getProducts());
    setActivities(getActivityLog());

    // 2. Fetch remote from Google Sheets via n8n
    // This is the NEW part we need to add!
    const result = await syncWithGoogleSheets();
    
    if (result) {
      setProducts(result.products);
      setActivities(result.logs);
      toast.success("Synced with Google Sheets");
    } else {
      // Only show error if we have NO data at all (first load fail)
      if (Object.keys(products).length === 0) {
         toast.error("Sync failed, please check connection");
      }
    }
    
    setIsSyncing(false);
  };

  // Initial Load
  useEffect(() => {
    refreshData();
  }, []);

  // Calculate stats - count unique orders only
  const uniqueOrders = [...new Set(
    activities
      .filter(a => a.type === 'invoice' && a.orderNumber)
      .map(a => a.orderNumber)
  )];
  const totalOrders = uniqueOrders.length;
  
  // Calculate this month/week stats
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
        </div>
        <div className="p-6 rounded-lg border bg-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">This Month</span>
            <FileSpreadsheet className="h-5 w-5 text-primary" />
          </div>
          <div className="text-3xl font-bold">{thisMonth}</div>
          <p className="text-xs text-muted-foreground mt-1">Orders</p>
        </div>
        <div className="p-6 rounded-lg border bg-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">This Week</span>
            <RefreshCw className="h-5 w-5 text-primary" />
          </div>
          <div className="text-3xl font-bold">{thisWeek}</div>
          <p className="text-xs text-muted-foreground mt-1">Orders</p>
        </div>
        <div className="p-6 rounded-lg border bg-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Inventory Value</span>
            <Plus className="h-5 w-5 text-primary" />
          </div>
          <div className="text-3xl font-bold">RM {totalValue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">Retail Value</p>
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
        <Button variant="outline" onClick={refreshData} disabled={isSyncing} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync with Sheet'}
        </Button>
        <Button variant="outline" onClick={() => setIsExportDialogOpen(true)} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Export
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

      {/* Activity Feed */}
      <ActivityFeed 
        activities={[...activities].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())} 
        limit={10} 
      />

      {/* Modals */}
      <ManualAdjustmentModal
        open={isAdjustmentModalOpen}
        onOpenChange={setIsAdjustmentModalOpen}
        onSuccess={() => {
          // Re-fetch to include manual adjustment
          setProducts(getProducts());
          setActivities(getActivityLog());
        }}
      />

      <ExportSheetsDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
      />
    </div>
  );
};

export default Dashboard;

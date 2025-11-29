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
import { Plus, RefreshCw, FileSpreadsheet } from 'lucide-react';

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

      {/* Activity Feed */}
      <ActivityFeed activities={activities} limit={10} />

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

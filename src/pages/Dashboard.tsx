import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { getProducts, getActivityLog } from '@/lib/storage';
import { Package as PackageType } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import PackageCalculator from '@/components/PackageCalculator';
import ActivityFeed from '@/components/ActivityFeed';
import ManualAdjustmentModal from '@/components/ManualAdjustmentModal';
import { LogOut, Plus, RefreshCw } from 'lucide-react';

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

  const refreshData = () => {
    setProducts(getProducts());
    setActivities(getActivityLog());
  };

  useEffect(() => {
    refreshData();
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">Ahad Network</h1>
              <p className="text-sm text-muted-foreground">Inventory Management</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold">{user?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
              <Button variant="outline" size="icon" onClick={logout} title="Logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
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
      </main>

      {/* Manual Adjustment Modal */}
      <ManualAdjustmentModal
        open={isAdjustmentModalOpen}
        onOpenChange={setIsAdjustmentModalOpen}
        onSuccess={refreshData}
      />
    </div>
  );
};

export default Dashboard;

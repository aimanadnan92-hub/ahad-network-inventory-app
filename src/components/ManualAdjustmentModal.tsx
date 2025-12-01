import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getProducts, updateProductStock, getActivityLog } from '@/lib/storage';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';

interface ManualAdjustmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ManualAdjustmentModal = ({ open, onOpenChange, onSuccess }: ManualAdjustmentModalProps) => {
  const { user } = useAuth();
  const [productId, setProductId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove' | 'temporary-out' | 'return' | 'damaged' | 'missing' | 'expired' | 'sample-demo'>('add');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [adjustmentDate, setAdjustmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [adjustmentTime, setAdjustmentTime] = useState(new Date().toTimeString().split(' ')[0].substring(0, 5));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLargeQtyWarning, setShowLargeQtyWarning] = useState(false);
  const [showBulkWarning, setShowBulkWarning] = useState(false);

  const products = getProducts();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productId || !quantity || !notes.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to make adjustments');
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    // Validate date is not in future
    const selectedDateTime = new Date(`${adjustmentDate}T${adjustmentTime}`);
    const now = new Date();
    if (selectedDateTime > now) {
      toast.error('Cannot select future date');
      return;
    }

    // Large quantity warning
    if (qty > 50 && !showLargeQtyWarning) {
      setShowLargeQtyWarning(true);
      return;
    }

    // Bulk adjustment warning
    if (productId === 'all' && !showBulkWarning) {
      setShowBulkWarning(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const productsToUpdate = productId === 'all' 
        ? Object.keys(products) 
        : [productId];

      // Check for negative stock
      for (const pid of productsToUpdate) {
        const product = products[pid];
        const isDeduction = ['remove', 'temporary-out', 'damaged', 'missing', 'expired', 'sample-demo'].includes(adjustmentType);
        
        if (isDeduction && product.stock < qty) {
          toast.error(`Cannot process: ${product.name} would have negative stock (Current: ${product.stock}, Requested: -${qty})`);
          setIsSubmitting(false);
          return;
        }
      }

      const productUpdates = productsToUpdate.map(pid => {
        const product = products[pid];
        const currentStock = product.stock;
        
        let newStock = currentStock;
        let change = 0;

        switch (adjustmentType) {
          case 'add':
          case 'return':
            newStock = currentStock + qty;
            change = qty;
            break;
          case 'remove':
          case 'temporary-out':
          case 'damaged':
          case 'missing':
          case 'expired':
          case 'sample-demo':
            newStock = Math.max(0, currentStock - qty);
            change = -(currentStock - newStock);
            break;
        }

        // Update stock
        updateProductStock(pid, newStock);

        return {
          productId: pid,
          before: currentStock,
          after: newStock,
          change,
        };
      });

      // Log activity with custom timestamp
      const customTimestamp = new Date(`${adjustmentDate}T${adjustmentTime}`).toISOString();
      const logs = getActivityLog();
      const newLog = {
        id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: customTimestamp,
        type: adjustmentType as any,
        productUpdates,
        userId: user.id,
        userName: user.name,
        notes,
      };
      logs.push(newLog);
      localStorage.setItem('ahad-activity-log', JSON.stringify(logs));

      toast.success(productId === 'all' 
        ? 'Successfully adjusted all 3 products' 
        : 'Inventory updated successfully'
      );
      
      // Reset form
      setProductId('');
      setAdjustmentType('add');
      setQuantity('');
      setNotes('');
      setAdjustmentDate(new Date().toISOString().split('T')[0]);
      setAdjustmentTime(new Date().toTimeString().split(' ')[0].substring(0, 5));
      setShowLargeQtyWarning(false);
      setShowBulkWarning(false);
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update inventory');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o) {
        setShowLargeQtyWarning(false);
        setShowBulkWarning(false);
      }
      onOpenChange(o);
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manual Inventory Adjustment</DialogTitle>
          <DialogDescription>
            Update product stock levels manually. All changes will be logged.
          </DialogDescription>
        </DialogHeader>
        
        {showLargeQtyWarning ? (
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning">
              <span className="text-2xl">⚠️</span>
              <div className="space-y-2">
                <p className="font-semibold">Large Quantity Detected</p>
                <p className="text-sm text-muted-foreground">
                  You're about to adjust <strong>{quantity} units</strong>. This is more than 50 units.
                </p>
                <p className="text-sm font-medium">Are you sure this is correct?</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowLargeQtyWarning(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowLargeQtyWarning(false);
                  handleSubmit({ preventDefault: () => {} } as any);
                }}
              >
                Yes, I'm Sure
              </Button>
            </div>
          </div>
        ) : showBulkWarning ? (
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning">
              <span className="text-2xl">⚠️</span>
              <div className="space-y-2">
                <p className="font-semibold">Bulk Adjustment Confirmation</p>
                <p className="text-sm text-muted-foreground">
                  This will adjust <strong>all 3 products</strong> by <strong>{quantity} units</strong> each.
                </p>
                <p className="text-sm font-medium">Continue?</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowBulkWarning(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowBulkWarning(false);
                  handleSubmit({ preventDefault: () => {} } as any);
                }}
              >
                Yes, Continue
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product">Product *</Label>
              <Select value={productId} onValueChange={setProductId} disabled={isSubmitting}>
                <SelectTrigger id="product">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <strong>All Products (Bulk Adjust)</strong>
                  </SelectItem>
                  {Object.values(products).map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} (Current: {product.stock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Adjustment Type *</Label>
              <RadioGroup
                value={adjustmentType}
                onValueChange={(value) => setAdjustmentType(value as any)}
                disabled={isSubmitting}
                className="grid grid-cols-2 gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="add" id="add" />
                  <Label htmlFor="add" className="font-normal cursor-pointer">
                    Add Stock (+)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="remove" id="remove" />
                  <Label htmlFor="remove" className="font-normal cursor-pointer">
                    Remove Stock (-)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="temporary-out" id="temporary-out" />
                  <Label htmlFor="temporary-out" className="font-normal cursor-pointer">
                    Temporary Out
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="return" id="return" />
                  <Label htmlFor="return" className="font-normal cursor-pointer">
                    Return to Stock
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="damaged" id="damaged" />
                  <Label htmlFor="damaged" className="font-normal cursor-pointer">
                    Damaged
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="missing" id="missing" />
                  <Label htmlFor="missing" className="font-normal cursor-pointer">
                    Missing
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="expired" id="expired" />
                  <Label htmlFor="expired" className="font-normal cursor-pointer">
                    Expired
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sample-demo" id="sample-demo" />
                  <Label htmlFor="sample-demo" className="font-normal cursor-pointer">
                    Sample/Demo
                  </Label>
                </div>
              </RadioGroup>
            </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adjustmentDate">Date of Adjustment *</Label>
              <Input
                id="adjustmentDate"
                type="date"
                value={adjustmentDate}
                onChange={(e) => setAdjustmentDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adjustmentTime">Time (Optional)</Label>
              <Input
                id="adjustmentTime"
                type="time"
                value={adjustmentTime}
                onChange={(e) => setAdjustmentTime(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Reason/Notes *</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Explain the reason for this adjustment..."
              rows={3}
              disabled={isSubmitting}
              required
            />
          </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Adjustment'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ManualAdjustmentModal;

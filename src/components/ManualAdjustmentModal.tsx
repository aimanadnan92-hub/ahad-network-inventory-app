import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getProducts, updateProductStock, addActivityLog } from '@/lib/storage';
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
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove' | 'temporary-out' | 'return'>('add');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setIsSubmitting(true);

    try {
      const qty = parseInt(quantity);
      if (isNaN(qty) || qty <= 0) {
        toast.error('Please enter a valid quantity');
        setIsSubmitting(false);
        return;
      }

      const product = products[productId];
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
          newStock = Math.max(0, currentStock - qty);
          change = -(currentStock - newStock);
          break;
      }

      // Update stock
      updateProductStock(productId, newStock);

      // Log activity
      addActivityLog({
        type: adjustmentType === 'add' || adjustmentType === 'remove' ? 'manual' : adjustmentType,
        productUpdates: [
          {
            productId,
            before: currentStock,
            after: newStock,
            change,
          },
        ],
        userId: user.id,
        userName: user.name,
        notes,
      });

      toast.success('Inventory updated successfully');
      
      // Reset form
      setProductId('');
      setAdjustmentType('add');
      setQuantity('');
      setNotes('');
      
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manual Inventory Adjustment</DialogTitle>
          <DialogDescription>
            Update product stock levels manually. All changes will be logged.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">Product *</Label>
            <Select value={productId} onValueChange={setProductId} disabled={isSubmitting}>
              <SelectTrigger id="product">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
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
              className="space-y-2"
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
                  Temporary Out (event/demo)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="return" id="return" />
                <Label htmlFor="return" className="font-normal cursor-pointer">
                  Return to Stock
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
      </DialogContent>
    </Dialog>
  );
};

export default ManualAdjustmentModal;

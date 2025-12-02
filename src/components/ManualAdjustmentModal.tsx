import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getProducts, writeAdjustmentToGoogleSheets, syncWithGoogleSheets } from '@/lib/storage';
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
  const [adjustmentType, setAdjustmentType] = useState('add');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [adjustmentDate, setAdjustmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const products = getProducts();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productId || !quantity || !notes.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Prepare Data for n8n
      // If "all" is selected, we send "All Products" as the name.
      const selectedProduct = productId === 'all' ? 'All Products' : products[productId].name;
      
      const payload = {
        date: adjustmentDate,
        product: selectedProduct,
        quantity: parseInt(quantity),
        type: adjustmentType,
        reason: notes + (user ? ` (by ${user.name})` : '')
      };

      // 2. Send to Google Sheets via n8n
      const success = await writeAdjustmentToGoogleSheets(payload);

      if (success) {
        toast.success('Adjustment recorded in Google Sheets');
        
        // 3. Trigger Sync to update UI immediately
        await syncWithGoogleSheets();
        
        // Reset form and close modal
        setProductId('');
        setQuantity('');
        setNotes('');
        setAdjustmentType('add'); // Reset type to default
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error('Failed to save to Google Sheets. Check console for details.');
      }

    } catch (error) {
      toast.error('Error submitting adjustment');
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
            This will add a record to the "Adjustments" tab in your Google Sheet.
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
                <SelectItem value="all"><strong>All Products (Bulk Adjust)</strong></SelectItem>
                {Object.values(products).map((product: any) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Adjustment Type *</Label>
            <RadioGroup
              value={adjustmentType}
              onValueChange={setAdjustmentType}
              disabled={isSubmitting}
              className="grid grid-cols-2 gap-2"
            >
              <div className="flex items-center space-x-2"><RadioGroupItem value="add" id="add" /><Label htmlFor="add">Add Stock (+)</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="remove" id="remove" /><Label htmlFor="remove">Remove Stock (-)</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="damaged" id="damaged" /><Label htmlFor="damaged">Damaged (-)</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="sample-demo" id="sample-demo" /><Label htmlFor="sample-demo">Sample/Demo (-)</Label></div>
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
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={adjustmentDate}
              onChange={(e) => setAdjustmentDate(e.target.value)}
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
              placeholder="E.g., Stock taken for roadshow..."
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Submit Adjustment'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ManualAdjustmentModal;

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Download } from 'lucide-react';
import { exportToCSV } from '@/lib/exportUtils';
import { useToast } from '@/hooks/use-toast';

interface ExportSheetsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ExportSheetsDialog = ({ open, onOpenChange }: ExportSheetsDialogProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = () => {
    setIsExporting(true);
    
    try {
      exportToCSV();
      
      toast({
        title: 'Export Successful',
        description: 'Inventory and activity log have been exported to CSV files',
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Export to CSV
          </DialogTitle>
          <DialogDescription>
            Export current inventory status and complete activity log to CSV files
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-3">
          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <Download className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-semibold text-sm">ahad-inventory.csv</p>
              <p className="text-xs text-muted-foreground">
                Current stock levels, prices, and values
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <Download className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-semibold text-sm">ahad-activity-log.csv</p>
              <p className="text-xs text-muted-foreground">
                Complete transaction history
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting} className="gap-2">
            {isExporting ? (
              <>Exporting...</>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export Files
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportSheetsDialog;

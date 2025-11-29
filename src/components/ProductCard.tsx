import { Product } from '@/types/inventory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, TrendingDown, TrendingUp } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const totalValue = product.stock * product.retailPrice;
  
  const getStockStatus = () => {
    if (product.stock > 500) {
      return { label: 'Healthy', variant: 'default' as const, icon: '✅', color: 'text-success' };
    } else if (product.stock >= 100) {
      return { label: 'Low Stock', variant: 'secondary' as const, icon: '⚠️', color: 'text-warning' };
    } else {
      return { label: 'Critical', variant: 'destructive' as const, icon: '🚨', color: 'text-destructive' };
    }
  };

  const status = getStockStatus();

  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {product.name}
          </div>
        </CardTitle>
        <Badge variant={status.variant}>{status.icon} {status.label}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">Current Stock</p>
          <p className={`text-3xl font-bold font-mono-data ${status.color}`}>
            {product.stock}
          </p>
          <p className="text-xs text-muted-foreground mt-1">units</p>
        </div>
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Value</span>
            <span className="text-lg font-semibold font-mono-data">
              RM {totalValue.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-muted-foreground">Retail Price</span>
            <span className="text-xs font-mono-data">RM {product.retailPrice.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;

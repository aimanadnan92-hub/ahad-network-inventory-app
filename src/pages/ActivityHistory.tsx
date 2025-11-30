import { useState, useMemo } from 'react';
import { getActivityLog, getProducts } from '@/lib/storage';
import { ActivityLog } from '@/types/inventory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Search, FileText, Package, TrendingDown, RotateCcw, AlertTriangle, HelpCircle, Clock, Gift } from 'lucide-react';
import { format } from 'date-fns';

const ActivityHistory = () => {
  const [activities] = useState(getActivityLog());
  const [products] = useState(getProducts());
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        activity.orderNumber?.toLowerCase().includes(searchLower) ||
        activity.notes.toLowerCase().includes(searchLower);

      // Type filter
      const matchesType = typeFilter === 'all' || activity.type === typeFilter;

      // Product filter
      const matchesProduct = productFilter === 'all' || 
        activity.productUpdates.some(u => u.productId === productFilter);

      return matchesSearch && matchesType && matchesProduct;
    });
  }, [activities, searchQuery, typeFilter, productFilter]);

  const paginatedActivities = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredActivities.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredActivities, currentPage]);

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);

  const exportToCSV = () => {
    const headers = ['Date/Time', 'Transaction ID', 'Type', 'Order Number', 'Products', 'Quantity Change', 'User', 'Notes'];
    const rows = filteredActivities.map(activity => [
      format(new Date(activity.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      activity.id,
      activity.type,
      activity.orderNumber || 'N/A',
      activity.productUpdates.map(u => products[u.productId]?.name || u.productId).join('; '),
      activity.productUpdates.map(u => u.change).join('; '),
      activity.userName,
      activity.notes
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ahad-activity-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const getProductName = (productId: string) => {
    return products[productId]?.name || productId;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'invoice': return <FileText className="h-3 w-3" />;
      case 'manual': return <Package className="h-3 w-3" />;
      case 'temporary-out': return <TrendingDown className="h-3 w-3" />;
      case 'return': return <RotateCcw className="h-3 w-3" />;
      case 'damaged': return <AlertTriangle className="h-3 w-3" />;
      case 'missing': return <HelpCircle className="h-3 w-3" />;
      case 'expired': return <Clock className="h-3 w-3" />;
      case 'sample-demo': return <Gift className="h-3 w-3" />;
      default: return <Package className="h-3 w-3" />;
    }
  };

  const getTypeBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'invoice': return 'default';
      case 'damaged':
      case 'missing':
      case 'expired': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Activity History</h1>
        <p className="text-muted-foreground">Complete transaction history and inventory changes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order number or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="invoice">Invoice</SelectItem>
                <SelectItem value="manual">Manual Adjustment</SelectItem>
                <SelectItem value="temporary-out">Temporary Out</SelectItem>
                <SelectItem value="return">Return to Stock</SelectItem>
                <SelectItem value="damaged">Damaged</SelectItem>
                <SelectItem value="missing">Missing</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="sample-demo">Sample/Demo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {Object.values(products).map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={exportToCSV} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Order #</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead className="text-right">Changes</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedActivities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No activities found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-mono-data text-sm">
                        {format(new Date(activity.timestamp), 'yyyy-MM-dd HH:mm')}
                      </TableCell>
                      <TableCell className="font-mono-data text-xs text-muted-foreground">
                        {activity.id.slice(0, 12)}...
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTypeBadgeVariant(activity.type)} className="gap-1">
                          {getTypeIcon(activity.type)}
                          {activity.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono-data">
                        {activity.orderNumber || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {activity.productUpdates.map((update, idx) => (
                            <div key={idx} className="text-sm">
                              {getProductName(update.productId)}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          {activity.productUpdates.map((update, idx) => (
                            <div
                              key={idx}
                              className={`font-mono-data text-sm ${
                                update.change < 0 ? 'text-destructive' : 'text-success'
                              }`}
                            >
                              {update.before} → {update.after} ({update.change > 0 ? '+' : ''}{update.change})
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{activity.userName}</TableCell>
                      <TableCell className="max-w-xs truncate text-sm">{activity.notes}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredActivities.length)} of {filteredActivities.length} transactions
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityHistory;

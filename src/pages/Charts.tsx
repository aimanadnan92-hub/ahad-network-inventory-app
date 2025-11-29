import { useMemo } from 'react';
import { getActivityLog, getProducts } from '@/lib/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, Package } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))'];

const Charts = () => {
  const activities = getActivityLog();
  const products = getProducts();

  // Calculate stock levels over last 30 days
  const stockOverTime = useMemo(() => {
    const days = 30;
    const data = [];
    const productStocks: Record<string, number> = {};
    
    // Start with current stock
    Object.entries(products).forEach(([id, product]) => {
      productStocks[id] = product.stock;
    });

    // Work backwards through activities to reconstruct historical stock
    for (let i = 0; i < days; i++) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'MMM dd');
      
      const dayData: any = { date: dateStr };
      Object.entries(products).forEach(([id, product]) => {
        dayData[product.name] = productStocks[id];
      });
      data.unshift(dayData);

      // Reverse the changes from this day
      activities.forEach(activity => {
        const activityDate = startOfDay(new Date(activity.timestamp));
        if (activityDate.getTime() === startOfDay(date).getTime()) {
          activity.productUpdates.forEach(update => {
            productStocks[update.productId] -= update.change;
          });
        }
      });
    }

    return data;
  }, [activities, products]);

  // Weekly changes (additions vs deductions)
  const weeklyChanges = useMemo(() => {
    const weeks = 4;
    const data = [];

    for (let i = 0; i < weeks; i++) {
      const weekStart = subDays(new Date(), (i + 1) * 7);
      const weekEnd = subDays(new Date(), i * 7);
      
      let additions = 0;
      let deductions = 0;

      activities.forEach(activity => {
        const activityDate = new Date(activity.timestamp);
        if (activityDate >= weekStart && activityDate < weekEnd) {
          activity.productUpdates.forEach(update => {
            if (update.change > 0) {
              additions += update.change;
            } else {
              deductions += Math.abs(update.change);
            }
          });
        }
      });

      data.unshift({
        week: `Week ${weeks - i}`,
        Additions: additions,
        Deductions: deductions,
      });
    }

    return data;
  }, [activities]);

  // Product distribution (total deductions per product)
  const productDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};

    activities.forEach(activity => {
      activity.productUpdates.forEach(update => {
        if (update.change < 0) {
          const productName = products[update.productId]?.name || update.productId;
          distribution[productName] = (distribution[productName] || 0) + Math.abs(update.change);
        }
      });
    });

    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
    }));
  }, [activities, products]);

  // Summary stats
  const stats = useMemo(() => {
    const totalTransactions = activities.length;
    const productDeductions: Record<string, number> = {};

    activities.forEach(activity => {
      activity.productUpdates.forEach(update => {
        if (update.change < 0) {
          productDeductions[update.productId] = (productDeductions[update.productId] || 0) + Math.abs(update.change);
        }
      });
    });

    const mostActiveProduct = Object.entries(productDeductions).sort((a, b) => b[1] - a[1])[0];
    const mostActiveProductName = mostActiveProduct ? products[mostActiveProduct[0]]?.name : 'N/A';

    // Average daily changes
    const daysWithActivity = new Set(activities.map(a => format(new Date(a.timestamp), 'yyyy-MM-dd'))).size;
    const avgDailyChanges = daysWithActivity > 0 ? (totalTransactions / daysWithActivity).toFixed(1) : '0';

    return {
      totalTransactions,
      mostActiveProduct: mostActiveProductName,
      avgDailyChanges,
    };
  }, [activities, products]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Charts & Analytics</h1>
        <p className="text-muted-foreground">Visualize inventory trends and patterns</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono-data">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">All time activity</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Active Product</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mostActiveProduct}</div>
            <p className="text-xs text-muted-foreground">By sales volume</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Daily Changes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono-data">{stats.avgDailyChanges}</div>
            <p className="text-xs text-muted-foreground">Transactions per day</p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Levels Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Levels - Last 30 Days</CardTitle>
          <p className="text-sm text-muted-foreground">Track inventory changes over time</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stockOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              {Object.values(products).map((product, idx) => (
                <Line
                  key={product.id}
                  type="monotone"
                  dataKey={product.name}
                  stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Weekly Changes */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Inventory Changes</CardTitle>
            <p className="text-sm text-muted-foreground">Compare additions vs deductions</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyChanges}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="Additions" fill="hsl(var(--success))" />
                <Bar dataKey="Deductions" fill="hsl(var(--destructive))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Product Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Product Sales Distribution</CardTitle>
            <p className="text-sm text-muted-foreground">Total units sold by product</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={productDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {productDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Charts;

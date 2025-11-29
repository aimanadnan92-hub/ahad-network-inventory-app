import { ActivityLog } from '@/types/inventory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { FileText, TrendingDown, TrendingUp, Package, RotateCcw } from 'lucide-react';

interface ActivityFeedProps {
  activities: ActivityLog[];
  limit?: number;
}

const ActivityFeed = ({ activities, limit = 10 }: ActivityFeedProps) => {
  const displayActivities = activities.slice(0, limit);

  const getActivityIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'invoice':
        return <FileText className="h-4 w-4" />;
      case 'manual':
        return <Package className="h-4 w-4" />;
      case 'temporary-out':
        return <TrendingDown className="h-4 w-4" />;
      case 'return':
        return <RotateCcw className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: ActivityLog['type']) => {
    switch (type) {
      case 'invoice':
        return 'bg-primary/10 text-primary';
      case 'manual':
        return 'bg-secondary text-secondary-foreground';
      case 'temporary-out':
        return 'bg-warning/10 text-warning';
      case 'return':
        return 'bg-success/10 text-success';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (displayActivities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">No activity yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <p className="text-sm text-muted-foreground">Last {limit} transactions</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg border hover:bg-secondary/50 transition-colors"
            >
              <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-semibold text-sm truncate">
                    {activity.orderNumber ? `Order #${activity.orderNumber}` : 'Manual Adjustment'}
                  </p>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {activity.type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{activity.notes}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {activity.productUpdates.map((update, idx) => (
                    <span
                      key={idx}
                      className={`font-mono-data ${
                        update.change < 0 ? 'text-destructive' : 'text-success'
                      }`}
                    >
                      {update.change > 0 ? '+' : ''}{update.change}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })} • {activity.userName}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;

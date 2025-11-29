import { Package } from '@/types/inventory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PackageCalculatorProps {
  packages: Package[];
  availableSets: { bronze: number; silver: number; gold: number };
}

const PackageCalculator = ({ packages, availableSets }: PackageCalculatorProps) => {
  const getPackageDisplay = (type: string) => {
    switch (type) {
      case 'bronze':
        return { icon: '🥉', sets: availableSets.bronze, color: 'text-amber-700' };
      case 'silver':
        return { icon: '🥈', sets: availableSets.silver, color: 'text-slate-500' };
      case 'gold':
        return { icon: '🥇', sets: availableSets.gold, color: 'text-yellow-600' };
      default:
        return { icon: '📦', sets: 0, color: 'text-foreground' };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Packages</CardTitle>
        <p className="text-sm text-muted-foreground">Based on current stock levels</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {packages.map((pkg) => {
            const display = getPackageDisplay(pkg.type);
            return (
              <div
                key={pkg.type}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{display.icon}</span>
                  <div>
                    <p className="font-semibold">{pkg.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {pkg.multiplier} of each product
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold font-mono-data ${display.color}`}>
                    {display.sets}
                  </p>
                  <p className="text-xs text-muted-foreground">sets available</p>
                  <p className="text-sm font-semibold mt-1">
                    RM {pkg.price.toLocaleString('en-MY')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default PackageCalculator;

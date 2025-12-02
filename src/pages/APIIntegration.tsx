import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Copy, RefreshCw, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { processInvoice } from '@/lib/invoiceAPI';

// Store API key and stats in localStorage
const getStoredApiKey = () => {
  const stored = localStorage.getItem('ahad-api-key');
  if (stored) return stored;
  const newKey = 'ahad_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  localStorage.setItem('ahad-api-key', newKey);
  return newKey;
};

const getApiStats = () => {
  const stored = localStorage.getItem('ahad-api-stats');
  return stored ? JSON.parse(stored) : { total: 0, successful: 0, failed: 0, lastCall: null };
};

const updateApiStats = (success: boolean) => {
  const stats = getApiStats();
  stats.total += 1;
  if (success) stats.successful += 1;
  else stats.failed += 1;
  stats.lastCall = new Date().toISOString();
  localStorage.setItem('ahad-api-stats', JSON.stringify(stats));
  return stats;
};

const APIIntegration = () => {
  const [apiKey, setApiKey] = useState(getStoredApiKey);
  const [showKey, setShowKey] = useState(false);
  const [testOrderNumber, setTestOrderNumber] = useState('');
  const [testCustomerName, setTestCustomerName] = useState('');
  const [testProduct, setTestProduct] = useState('');
  const [testQuantity, setTestQuantity] = useState('1');
  const [testResponse, setTestResponse] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [apiStats, setApiStats] = useState(getApiStats);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const regenerateKey = () => {
    const newKey = 'ahad_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setApiKey(newKey);
    localStorage.setItem('ahad-api-key', newKey);
    toast.success('API key regenerated successfully');
  };

  const testEndpoint = async () => {
    if (!testOrderNumber || !testCustomerName || !testProduct) {
      toast.error('Please fill in all test fields');
      return;
    }

    setIsTesting(true);
    
    try {
      const response = await processInvoice({
        orderNumber: testOrderNumber,
        orderDate: new Date().toISOString(),
        customer: {
          name: testCustomerName,
          email: '',
          phone: ''
        },
        items: [{
          productName: testProduct,
          quantity: parseInt(testQuantity) || 1,
          price: 0
        }],
        total: 0,
        paymentMethod: 'Test'
      });

      setTestResponse(JSON.stringify(response, null, 2));
      const newStats = updateApiStats(response.success);
      setApiStats(newStats);

      if (response.success) {
        toast.success('Order processed successfully! Check Activity History.');
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      const errorResponse = {
        success: false,
        error: 'server_error',
        message: error.message || 'An unexpected error occurred'
      };
      setTestResponse(JSON.stringify(errorResponse, null, 2));
      const newStats = updateApiStats(false);
      setApiStats(newStats);
      toast.error('Test failed: ' + error.message);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">API Integration</h1>
        <p className="text-muted-foreground mt-2">
          Connect your WooCommerce store to automatically update inventory when orders are placed.
        </p>
      </div>

      {/* API Key Management */}
      <Card>
        <CardHeader>
          <CardTitle>API Key Management</CardTitle>
          <CardDescription>
            Your API key is used to authenticate requests from external systems
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Current API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="apiKey"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  readOnly
                  className="pr-10"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button variant="outline" onClick={() => copyToClipboard(apiKey)}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" onClick={regenerateKey}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              ⚠️ Keep this key secure. Do not share publicly. Regenerating will invalidate the old key.
            </p>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-2">API Usage Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Calls</p>
                <p className="text-2xl font-bold">{apiStats.total}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Successful</p>
                <p className="text-2xl font-bold text-green-600">{apiStats.successful}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">{apiStats.failed}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Call</p>
                <p className="text-sm font-medium">
                  {apiStats.lastCall 
                    ? new Date(apiStats.lastCall).toLocaleString() 
                    : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endpoint Information */}
      <Card>
        <CardHeader>
          <CardTitle>Endpoint Information</CardTitle>
          <CardDescription>Use this endpoint to process orders automatically</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Base URL</Label>
            <div className="flex gap-2 mt-1">
              <Input value="https://inventory.ahadnetwork.com" readOnly className="flex-1" />
              <Button variant="outline" onClick={() => copyToClipboard('https://inventory.ahadnetwork.com')}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Endpoint</Label>
            <div className="flex gap-2 mt-1">
              <Input value="POST /api/inventory/invoice" readOnly className="flex-1" />
              <Button variant="outline" onClick={() => copyToClipboard('POST /api/inventory/invoice')}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Authentication</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Include your API key in the request headers:
            </p>
            <pre className="mt-2 p-4 bg-muted rounded-lg text-sm overflow-x-auto">
{`Headers:
Content-Type: application/json
X-API-Key: your-api-key-here`}
            </pre>
          </div>

          <div>
            <Label>Request Format</Label>
            <pre className="mt-2 p-4 bg-muted rounded-lg text-sm overflow-x-auto">
{`{
  "orderNumber": "1505",
  "orderDate": "2025-11-30T14:30:00Z",
  "customer": {
    "name": "Ahmad bin Ali",
    "email": "ahmad@example.com",
    "phone": "012-3456789"
  },
  "items": [
    {
      "productName": "Bronze Membership",
      "quantity": 1,
      "price": 775.00
    }
  ],
  "total": 775.00,
  "paymentMethod": "Online Banking (FPX)"
}`}
            </pre>
          </div>

          <div>
            <Label>Success Response (200 OK)</Label>
            <pre className="mt-2 p-4 bg-muted rounded-lg text-sm overflow-x-auto">
{`{
  "success": true,
  "message": "Order #1505 processed successfully",
  "orderNumber": "1505",
  "customer": "Ahmad bin Ali",
  "timestamp": "2025-11-30T14:30:00Z",
  "stockUpdates": [
    {
      "product": "Ahad Colostrum P",
      "productId": "colostrum-p",
      "before": 914,
      "after": 913,
      "change": -1
    }
  ]
}`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Product Name Mapping */}
      <Card>
        <CardHeader>
          <CardTitle>Product Name Mapping</CardTitle>
          <CardDescription>How product names are matched to inventory actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Product Name in WooCommerce</th>
                  <th className="text-left p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3 font-medium">Gold Membership</td>
                  <td className="p-3">Deducts 5 of each product</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium">Silver Membership</td>
                  <td className="p-3">Deducts 2 of each product</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium">Bronze Membership</td>
                  <td className="p-3">Deducts 1 of each product</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium">Ahad Colostrum P</td>
                  <td className="p-3">Deducts specified quantity</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium">Ahad Colostrum G</td>
                  <td className="p-3">Deducts specified quantity</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Ahad Barley Best</td>
                  <td className="p-3">Deducts specified quantity</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Test Endpoint */}
      <Card>
        <CardHeader>
          <CardTitle>Test Your Integration</CardTitle>
          <CardDescription>Send a test request to verify your setup</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="testOrderNumber">Order Number *</Label>
              <Input
                id="testOrderNumber"
                placeholder="e.g., 1505"
                value={testOrderNumber}
                onChange={(e) => setTestOrderNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="testCustomerName">Customer Name *</Label>
              <Input
                id="testCustomerName"
                placeholder="e.g., Ahmad bin Ali"
                value={testCustomerName}
                onChange={(e) => setTestCustomerName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="testProduct">Product *</Label>
              <Select value={testProduct} onValueChange={setTestProduct}>
                <SelectTrigger id="testProduct">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bronze Membership">Bronze Membership</SelectItem>
                  <SelectItem value="Silver Membership">Silver Membership</SelectItem>
                  <SelectItem value="Gold Membership">Gold Membership</SelectItem>
                  <SelectItem value="Ahad Colostrum P">Ahad Colostrum P</SelectItem>
                  <SelectItem value="Ahad Colostrum G">Ahad Colostrum G</SelectItem>
                  <SelectItem value="Ahad Barley Best">Ahad Barley Best</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="testQuantity">Quantity *</Label>
              <Input
                id="testQuantity"
                type="number"
                min="1"
                value={testQuantity}
                onChange={(e) => setTestQuantity(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={testEndpoint} disabled={isTesting} className="w-full">
            {isTesting ? 'Testing...' : 'Send Test Request'}
          </Button>

          {testResponse && (
            <div className="space-y-2">
              <Label>Response</Label>
              <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto max-h-[300px]">
                {testResponse}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integration Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold">Set up Webhook in WooCommerce</h4>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1 list-disc list-inside">
                  <li>Go to WooCommerce → Settings → Advanced → Webhooks</li>
                  <li>Click "Add webhook"</li>
                  <li>Name: "Ahad Inventory Integration"</li>
                  <li>Status: Active</li>
                  <li>Topic: Order created (or Order completed)</li>
                  <li>Delivery URL: Your n8n webhook URL</li>
                  <li>Save webhook</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold">Set up n8n Workflow</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a workflow that receives the webhook from WooCommerce, transforms the data, and sends it to the inventory API.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold">Test with Real Order</h4>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1 list-disc list-inside">
                  <li>Place a test order on your website</li>
                  <li>Check if inventory updates</li>
                  <li>Check activity log for new entry</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold">Order not processed?</h4>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1 list-disc list-inside">
                <li>Check API key is correct</li>
                <li>Verify product name matches exactly</li>
                <li>Check stock availability</li>
                <li>View activity log for errors</li>
              </ul>
            </div>
            
            <div className="pt-3 border-t">
              <h4 className="font-semibold">Need Help?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Contact: <a href="mailto:tech.ahadnetwork@gmail.com" className="text-primary hover:underline">tech.ahadnetwork@gmail.com</a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default APIIntegration;
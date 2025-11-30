import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { getUsers, saveUsers } from '@/lib/storage';
import { User } from '@/types/inventory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Ban, Download, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
import { format } from 'date-fns';
import { exportToCSV } from '@/lib/exportUtils';

const Settings = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState(getUsers());
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [minStockThreshold, setMinStockThreshold] = useState(100);
  const [criticalThreshold, setCriticalThreshold] = useState(50);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [showCustomerNames, setShowCustomerNames] = useState(true);
  const [showCustomerEmails, setShowCustomerEmails] = useState(false);
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [timeFormat, setTimeFormat] = useState('24-hour');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState('');

  // New user form
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    password: '',
    role: 'viewer' as 'admin' | 'staff' | 'viewer',
  });

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleAddUser = () => {
    if (!newUser.email || !newUser.name || !newUser.password) {
      sonnerToast.error('Please fill in all fields');
      return;
    }

    // Check if user already exists
    if (users.some(u => u.email === newUser.email)) {
      sonnerToast.error('User with this email already exists');
      return;
    }

    const user: User = {
      id: `user-${Date.now()}`,
      email: newUser.email,
      name: newUser.name,
      passwordHash: newUser.password, // In production, hash this
      role: newUser.role,
      createdAt: new Date().toISOString(),
    };

    const updatedUsers = [...users, user];
    saveUsers(updatedUsers);
    setUsers(updatedUsers);
    setIsAddUserOpen(false);
    setNewUser({ email: '', name: '', password: '', role: 'viewer' });

    sonnerToast.success(`User ${user.name} has been added`);
  };

  const handleDeactivateUser = (userId: string) => {
    const updatedUsers = users.filter(u => u.id !== userId);
    saveUsers(updatedUsers);
    setUsers(updatedUsers);
    sonnerToast.success('User has been removed from the system');
  };

  const handleExportData = () => {
    try {
      exportToCSV();
      sonnerToast.success('Data exported successfully');
    } catch (error) {
      sonnerToast.error('Failed to export data');
    }
  };

  const handleResetSystem = () => {
    if (resetConfirmation !== 'RESET') {
      sonnerToast.error('Please type "RESET" to confirm');
      return;
    }
    
    // This would reset the system data
    sonnerToast.success('System data has been reset');
    setIsResetDialogOpen(false);
    setResetConfirmation('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage system configuration and users</p>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </div>
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add New User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>Create a new user account with assigned role</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={newUser.role} onValueChange={(value: any) => setNewUser({ ...newUser, role: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddUser}>Add User</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono-data text-sm">{u.email}</TableCell>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.lastLogin ? format(new Date(u.lastLogin), 'MMM dd, yyyy HH:mm') : 'Never'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-success border-success">
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" disabled>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeactivateUser(u.id)}
                        disabled={u.id === user?.id}
                      >
                        <Ban className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stock Alert Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Alert Settings</CardTitle>
          <CardDescription>Configure notifications for low inventory levels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="threshold">Minimum Stock Threshold</Label>
            <Input
              id="threshold"
              type="number"
              value={minStockThreshold}
              onChange={(e) => setMinStockThreshold(Number(e.target.value))}
              className="max-w-xs"
            />
            <p className="text-sm text-muted-foreground">
              Alert when stock falls below this level
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="critical-threshold">Critical Stock Threshold</Label>
            <Input
              id="critical-threshold"
              type="number"
              value={criticalThreshold}
              onChange={(e) => setCriticalThreshold(Number(e.target.value))}
              className="max-w-xs"
            />
            <p className="text-sm text-muted-foreground">
              Critical alert when stock falls below this level
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="low-stock-alerts">Enable Low Stock Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Show alerts when stock &lt; threshold
              </p>
            </div>
            <Switch
              id="low-stock-alerts"
              checked={lowStockAlerts}
              onCheckedChange={setLowStockAlerts}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="critical-alerts">Enable Critical Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Show alerts when stock &lt; {criticalThreshold}
              </p>
            </div>
            <Switch
              id="critical-alerts"
              checked={criticalAlerts}
              onCheckedChange={setCriticalAlerts}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email alerts for low stock
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Display Settings</CardTitle>
          <CardDescription>Customize how information is displayed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date-format">Date Format</Label>
              <Select value={dateFormat} onValueChange={setDateFormat}>
                <SelectTrigger id="date-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="time-format">Time Format</Label>
              <Select value={timeFormat} onValueChange={setTimeFormat}>
                <SelectTrigger id="time-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24-hour">24-hour</SelectItem>
                  <SelectItem value="12-hour">12-hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-customer-names">Show Customer Names</Label>
              <p className="text-sm text-muted-foreground">
                Display customer names in activity log
              </p>
            </div>
            <Switch
              id="show-customer-names"
              checked={showCustomerNames}
              onCheckedChange={setShowCustomerNames}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-customer-emails">Show Customer Emails</Label>
              <p className="text-sm text-muted-foreground">
                Display customer emails in details
              </p>
            </div>
            <Switch
              id="show-customer-emails"
              checked={showCustomerEmails}
              onCheckedChange={setShowCustomerEmails}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Export or reset system data (Admin only)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
            <Button onClick={handleExportData} variant="outline" className="gap-2 justify-start">
              <Download className="h-4 w-4" />
              <div className="text-left">
                <div className="font-semibold">Export All Data to CSV</div>
                <div className="text-xs text-muted-foreground">Download complete inventory and activity history</div>
              </div>
            </Button>
            
            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 justify-start border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-semibold">Reset System Data</div>
                    <div className="text-xs opacity-80">⚠️ Danger: Reset stock to 1000 and clear all history</div>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Reset System Data
                  </DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. All inventory history and activity logs will be permanently deleted.
                    Stock levels will be reset to 1000 units for all products.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-confirm">Type "RESET" to confirm</Label>
                    <Input
                      id="reset-confirm"
                      value={resetConfirmation}
                      onChange={(e) => setResetConfirmation(e.target.value)}
                      placeholder="RESET"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsResetDialogOpen(false);
                    setResetConfirmation('');
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleResetSystem}
                    disabled={resetConfirmation !== 'RESET'}
                  >
                    Reset System
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>Business details and contact information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label className="text-muted-foreground">Company Name</Label>
            <p className="text-lg font-semibold">Arapacific Ahad Network Sdn. Bhd.</p>
          </div>
          <div className="grid gap-2">
            <Label className="text-muted-foreground">Address</Label>
            <p className="text-lg">3000A, Jalan Sultan Azlan Shah</p>
            <p className="text-lg">11700 Gelugor Penang</p>
          </div>
          <div className="grid gap-2">
            <Label className="text-muted-foreground">Currency</Label>
            <p className="text-lg font-mono-data">RM (Malaysian Ringgit)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;

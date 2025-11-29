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
import { Plus, Pencil, Ban } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState(getUsers());
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [minStockThreshold, setMinStockThreshold] = useState(100);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);

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
      toast({
        title: 'Validation Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    // Check if user already exists
    if (users.some(u => u.email === newUser.email)) {
      toast({
        title: 'Error',
        description: 'User with this email already exists',
        variant: 'destructive',
      });
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

    toast({
      title: 'Success',
      description: `User ${user.name} has been added`,
    });
  };

  const handleDeactivateUser = (userId: string) => {
    const updatedUsers = users.filter(u => u.id !== userId);
    saveUsers(updatedUsers);
    setUsers(updatedUsers);

    toast({
      title: 'User Deactivated',
      description: 'User has been removed from the system',
    });
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
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="low-stock-alerts">Low Stock Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Show dashboard alerts for low inventory
              </p>
            </div>
            <Switch
              id="low-stock-alerts"
              checked={lowStockAlerts}
              onCheckedChange={setLowStockAlerts}
            />
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

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types/inventory';
import { getCurrentUser, setCurrentUser, getUsers, updateUserLastLogin } from '@/lib/storage';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, rememberMe: boolean) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean): Promise<boolean> => {
    const users = getUsers();
    const foundUser = users.find(u => u.email === email && u.passwordHash === password);
    
    if (foundUser) {
      setUser(foundUser);
      setCurrentUser(foundUser);
      updateUserLastLogin(foundUser.id);
      toast.success(`Welcome back, ${foundUser.name}!`);
      return true;
    }
    
    toast.error('Invalid email or password');
    return false;
  };

  const logout = () => {
    setUser(null);
    setCurrentUser(null);
    toast.success('Logged out successfully');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

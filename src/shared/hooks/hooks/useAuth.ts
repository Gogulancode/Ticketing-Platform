import { useState, useEffect } from 'react';
import { getCurrentUser } from '../../../shared/services/api/auth';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  department?: string;
  role?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        let token = localStorage.getItem('token');
        
        // For demo purposes, auto-create a demo token if none exists
        if (!token) {
          token = 'demo-admin-token-12345';
          localStorage.setItem('token', token);
        }

        const userData = await getCurrentUser();
        setUser(userData);
        setIsAdmin(userData?.role === 'Admin' || false);
      } catch (error) {
        console.error('Error loading user:', error);
        // For demo purposes, assume admin if there's any token
        const token = localStorage.getItem('token');
        if (token) {
          setIsAdmin(true);
          setUser({
            id: 'demo-user',
            email: 'admin@erptraining.com',
            firstName: 'Admin',
            lastName: 'User',
            department: 'IT',
            role: 'Admin'
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return { user, loading, isAdmin };
}

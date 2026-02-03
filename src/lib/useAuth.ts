'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAccessToken, getRefreshToken } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage
    const userData = localStorage.getItem('user');
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    if (userData && accessToken && refreshToken) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Failed to parse user data:', error);
        setUser(null);
      }
    }

    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !!getAccessToken(),
    logout,
  };
}

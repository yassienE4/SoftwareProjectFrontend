'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '@/lib/api';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = require('react').useState(true);
  const [isAuthorized, setIsAuthorized] = require('react').useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const accessToken = getAccessToken();
    
    if (!accessToken) {
      router.push('/auth');
      return;
    }

    // If a specific role is required, verify it
    if (requiredRole) {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.role !== requiredRole && user.role !== 'Admin') {
          router.push('/');
          return;
        }
      } else {
        router.push('/auth');
        return;
      }
    }

    setIsAuthorized(true);
    setIsLoading(false);
  }, [router, requiredRole]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}

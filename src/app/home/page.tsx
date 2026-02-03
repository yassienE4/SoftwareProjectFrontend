'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken, getRefreshToken, refreshAccessToken } from '@/lib/api';

// Helper to decode JWT and check expiry
function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return true;
    // exp is in seconds, Date.now() is ms
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const checkAuth = async () => {
      let accessToken = getAccessToken();
      
      // If token is expired, try to refresh it
      if (accessToken && isTokenExpired(accessToken)) {
        try {
          await refreshAccessToken();
          accessToken = getAccessToken();
        } catch (error) {
          router.push('/login');
          return;
        }
      }
      
      // If no valid token, redirect to login
      if (!accessToken || isTokenExpired(accessToken)) {
        router.push('/login');
        return;
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [isMounted, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Home Page</h1>
      <p className="mt-4">Welcome to your dashboard!</p>
    </main>
  );
}
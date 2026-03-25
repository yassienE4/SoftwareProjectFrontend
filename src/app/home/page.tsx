'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken, refreshAccessToken } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

function decodeJwtPayload(token: string): Record<string, unknown> {
  const payload = token.split('.')[1];

  if (!payload) {
    throw new Error('Invalid token');
  }

  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

  return JSON.parse(atob(paddedBase64));
}

// Helper to decode JWT and check expiry
function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const payload = decodeJwtPayload(token) as { exp?: number };

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
      <main className="p-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96 mt-4" />
      </main>
    );
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Home Page</h1>
      <p className="mt-4">Welcome to your dashboard!</p>
    </main>
  );
}
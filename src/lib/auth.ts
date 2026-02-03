/**
 * Authentication utilities for JWT token management and authenticated requests
 */

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

export function isAuthenticated(): boolean {
  return getAccessToken() !== null;
}

/**
 * Make an authenticated fetch request with automatic token refresh
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('No access token available. Please login first.');
  }

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${accessToken}`,
  };

  let response = await fetch(url, { ...options, headers });

  // If token expired (403), try to refresh and retry
  if (response.status === 403) {
    try {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        const newHeaders = {
          ...options.headers,
          'Authorization': `Bearer ${getAccessToken()}`,
        };
        response = await fetch(url, { ...options, headers: newHeaders });
      }
    } catch (error) {
      // Refresh failed, redirect to login
      clearTokens();
      window.location.href = '/auth';
      throw error;
    }
  }

  return response;
}

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch('http://localhost:8080/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return false;
    }

    const data = await response.json();
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
      return true;
    }

    return false;
  } catch (error) {
    clearTokens();
    return false;
  }
}

/**
 * Get the current user from localStorage
 */
export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

/**
 * Set the current user in localStorage
 */
export function setCurrentUser(user: any): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user', JSON.stringify(user));
}

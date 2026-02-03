export const BASE_URL = 'http://localhost:8080/api';

export async function fetchHomeMessage(): Promise<{ message: string }> {
	const res = await fetch(`${BASE_URL}/home`, { cache: 'no-store' });

	if (!res.ok) {
		throw new Error('Failed to fetch home message');
	}

	return res.json();
}

export enum UserRole {
	Admin = 'Admin',
	Instructor = 'Instructor',
	Student = 'Student',
}

interface LoginRequest {
	email: string;
	password: string;
}

interface SignupRequest {
	email: string;
	name: string;
	password: string;
	role: UserRole;
}

interface AuthResponse {
	success: boolean;
	data: {
		id: string;
		email: string;
		name: string;
		role: string;
	};
	accessToken: string;
	refreshToken: string;
}

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
	const res = await fetch(`${BASE_URL}/auth/login`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(credentials),
	});

	if (!res.ok) {
		const error = await res.json();
		throw new Error(error.error || 'Login failed');
	}

	const response = await res.json();
	
	// Extract tokens from response.data (backend returns them there)
	const accessToken = response.data?.accessToken || response.accessToken;
	const refreshToken = response.data?.refreshToken || response.refreshToken;
	
	// Store tokens in localStorage (only on client side)
	if (typeof window !== 'undefined') {
		if (accessToken) {
			localStorage.setItem('accessToken', accessToken);
		}
		if (refreshToken) {
			localStorage.setItem('refreshToken', refreshToken);
		}
	}
	
	return response;
}

export async function signup(data: SignupRequest): Promise<AuthResponse> {
	const res = await fetch(`${BASE_URL}/auth/signup`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(data),
	});

	if (!res.ok) {
		const error = await res.json();
		throw new Error(error.error || 'Sign up failed');
	}

	const response = await res.json();
	
	// Extract tokens from response.data (backend returns them there)
	const accessToken = response.data?.accessToken || response.accessToken;
	const refreshToken = response.data?.refreshToken || response.refreshToken;
	
	// Store tokens in localStorage (only on client side)
	if (typeof window !== 'undefined') {
		if (accessToken) {
			localStorage.setItem('accessToken', accessToken);
		}
		if (refreshToken) {
			localStorage.setItem('refreshToken', refreshToken);
		}
	}
	
	return response;
}

export async function refreshAccessToken(): Promise<{ accessToken: string }> {
	const refreshToken = localStorage.getItem('refreshToken');
	
	if (!refreshToken) {
		throw new Error('No refresh token available');
	}

	const res = await fetch(`${BASE_URL}/auth/refresh`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ refreshToken }),
	});

	if (!res.ok) {
		// Clear tokens if refresh fails
		localStorage.removeItem('accessToken');
		localStorage.removeItem('refreshToken');
		throw new Error('Failed to refresh token');
	}

	const response = await res.json();
	
	if (response.accessToken) {
		localStorage.setItem('accessToken', response.accessToken);
	}
	
	return response;
}

export function getAccessToken(): string | null {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem('accessToken');
}

export function getRefreshToken(): string | null {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem('refreshToken');
}

export function logout(): void {
	localStorage.removeItem('accessToken');
	localStorage.removeItem('refreshToken');
	localStorage.removeItem('user');
}

/**
 * Make an authenticated API request with automatic token refresh on 401/403
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
		'Content-Type': 'application/json',
		...options.headers,
		'Authorization': `Bearer ${accessToken}`,
	};

	let response = await fetch(url, { ...options, headers });

	// If unauthorized or forbidden, try to refresh token
	if ((response.status === 401 || response.status === 403) && typeof window !== 'undefined') {
		try {
			await refreshAccessToken();
			const newAccessToken = getAccessToken();
			
			if (newAccessToken) {
				const newHeaders = {
					'Content-Type': 'application/json',
					...options.headers,
					'Authorization': `Bearer ${newAccessToken}`,
				};
				response = await fetch(url, { ...options, headers: newHeaders });
			}
		} catch (error) {
			// Refresh failed, clear tokens and redirect to login
			logout();
			if (typeof window !== 'undefined') {
				window.location.href = '/auth';
			}
			throw error;
		}
	}

	return response;
}


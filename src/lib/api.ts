

export const BASE_URL = 'http://localhost:8080/api';

export async function fetchHomeMessage(): Promise<{ message: string }> {
	const res = await fetch(`${BASE_URL}/home`, { cache: 'no-store' });

	if (!res.ok) {
		throw new Error('Failed to fetch home message');
	}

	return res.json();
}

interface LoginRequest {
	email: string;
	password: string;
}

interface SignupRequest {
	email: string;
	name: string;
	password: string;
	role?: string;
}

interface AuthResponse {
	success: boolean;
	data: {
		id: string;
		email: string;
		name: string;
		role: string;
	};
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

	return res.json();
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

	return res.json();
}


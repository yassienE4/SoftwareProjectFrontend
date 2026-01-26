

export const BASE_UR = 'http://localhost:8080/api';

export async function fetchHomeMessage(): Promise<{ message: string }> {
	const res = await fetch(`${BASE_UR}/home`, { cache: 'no-store' });

	if (!res.ok) {
		throw new Error('Failed to fetch home message');
	}

	return res.json();
}


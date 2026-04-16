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

export enum ExamStatus {
	Draft = 'Draft',
	Published = 'Published',
	Closed = 'Closed',
}

export enum QuestionType {
	MCQ = 'MCQ',
	TrueFalse = 'TrueFalse',
}

export enum AttemptStatus {
	InProgress = 'InProgress',
	Submitted = 'Submitted',
}

export interface User {
	id: string;
	email: string;
	name: string;
	role: UserRole;
	createdAt: string;
	updatedAt: string;
}

export interface Course {
	id: string;
	code: string;
	name: string;
	description: string | null;
	enrolledUserIds?: string[];
}

export interface Exam {
	id: string;
	title: string;
	description: string;
	instructorId: string;
	courseId: string;
	durationMinutes: number;
	availabilityStart: string | null;
	availabilityEnd: string | null;
	status: ExamStatus;
	createdAt: string;
	updatedAt: string;
}

export interface Question {
	id: string;
	examId: string;
	order: number;
	type: QuestionType;
	questionText: string;
	options: string[];
	correctAnswer: string;
	points: number;
	createdAt: string;
	updatedAt: string;
}

export interface ExamAttempt {
	id: string;
	examId: string;
	studentId: string;
	status: AttemptStatus;
	answers: Record<string, string>;
	score: number | null;
	startedAt: string | null;
	submittedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface CreateUserRequest {
	email: string;
	name: string;
	password: string;
	role?: UserRole;
}

export interface UpdateUserRequest {
	name?: string;
	email?: string;
	role?: UserRole;
	password?: string;
}

export interface CreateCourseRequest {
	code: string;
	name: string;
	description?: string;
}

export interface EnrollUsersRequest {
	userId?: string;
	userIds?: string[];
}

export interface CreateExamRequest {
	title: string;
	description: string;
	durationMinutes: number;
	courseId: string;
	availabilityStart?: string | null;
	availabilityEnd?: string | null;
	status?: ExamStatus;
	instructorId?: string;
}

export interface UpdateExamRequest {
	title?: string;
	description?: string;
	durationMinutes?: number;
	courseId?: string;
	availabilityStart?: string | null;
	availabilityEnd?: string | null;
	status?: ExamStatus;
	instructorId?: string;
}

export interface CreateQuestionRequest {
	order: number;
	type: QuestionType;
	questionText: string;
	options: string[];
	correctAnswer: string;
	points: number;
}

export interface UpdateQuestionRequest {
	order?: number;
	type?: QuestionType;
	questionText?: string;
	options?: string[];
	correctAnswer?: string;
	points?: number;
}

export interface SubmitAttemptRequest {
	answers: Record<string, string>;
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

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
	try {
		const payload = await response.json();
		return payload.error || fallback;
	} catch {
		return fallback;
	}
}

async function readData<T>(response: Response, fallback: string): Promise<T> {
	if (!response.ok) {
		throw new Error(await readErrorMessage(response, fallback));
	}

	const result = await response.json();
	return result.data as T;
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

export function getCurrentUser(): User | null {
	if (typeof window === 'undefined') return null;

	const userData = localStorage.getItem('user');
	if (!userData) return null;

	try {
		return JSON.parse(userData) as User;
	} catch {
		return null;
	}
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
				window.location.href = '/login';
			}
			throw error;
		}
	}

	return response;
}

// ============================================
// Exam Management API Functions
// ============================================

export async function getExams(): Promise<Exam[]> {
	const response = await authenticatedFetch(`${BASE_URL}/exams`);
	return readData<Exam[]>(response, 'Failed to fetch exams');
}

export async function getMyCourses(): Promise<Course[]> {
	const response = await authenticatedFetch(`${BASE_URL}/courses/me`);
	return readData<Course[]>(response, 'Failed to fetch courses');
}

export async function getCourses(): Promise<Course[]> {
	const response = await authenticatedFetch(`${BASE_URL}/courses`);
	return readData<Course[]>(response, 'Failed to fetch courses');
}

export async function createCourse(data: CreateCourseRequest): Promise<Course> {
	const response = await authenticatedFetch(`${BASE_URL}/courses`, {
		method: 'POST',
		body: JSON.stringify(data),
	});

	return readData<Course>(response, 'Failed to create course');
}

export async function enrollUsersInCourse(courseId: string, data: EnrollUsersRequest): Promise<{ message: string }> {
	const response = await authenticatedFetch(`${BASE_URL}/courses/${courseId}/enrollments`, {
		method: 'POST',
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		throw new Error(await readErrorMessage(response, 'Failed to enroll users in course'));
	}

	return response.json();
}

export async function removeUserFromCourse(courseId: string, userId: string): Promise<{ message: string }> {
	const response = await authenticatedFetch(`${BASE_URL}/courses/${courseId}/enrollments/${userId}`, {
		method: 'DELETE',
	});

	if (!response.ok) {
		throw new Error(await readErrorMessage(response, 'Failed to remove user from course'));
	}

	return response.json();
}

export async function getExamById(id: string): Promise<Exam> {
	const response = await authenticatedFetch(`${BASE_URL}/exams/${id}`);
	return readData<Exam>(response, 'Failed to fetch exam');
}

export async function createExam(data: CreateExamRequest): Promise<Exam> {
	const response = await authenticatedFetch(`${BASE_URL}/exams`, {
		method: 'POST',
		body: JSON.stringify(data),
	});

	return readData<Exam>(response, 'Failed to create exam');
}

export async function updateExam(id: string, data: UpdateExamRequest): Promise<Exam> {
	const response = await authenticatedFetch(`${BASE_URL}/exams/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(data),
	});

	return readData<Exam>(response, 'Failed to update exam');
}

export async function deleteExam(id: string): Promise<{ message: string }> {
	const response = await authenticatedFetch(`${BASE_URL}/exams/${id}`, {
		method: 'DELETE',
	});

	if (!response.ok) {
		throw new Error(await readErrorMessage(response, 'Failed to delete exam'));
	}

	return response.json();
}

export async function getExamQuestions(examId: string): Promise<Question[]> {
	const response = await authenticatedFetch(`${BASE_URL}/exams/${examId}/questions`);
	return readData<Question[]>(response, 'Failed to fetch questions');
}

export async function createQuestion(
	examId: string,
	data: CreateQuestionRequest
): Promise<Question> {
	const response = await authenticatedFetch(`${BASE_URL}/exams/${examId}/questions`, {
		method: 'POST',
		body: JSON.stringify(data),
	});

	return readData<Question>(response, 'Failed to create question');
}

export async function updateQuestion(
	examId: string,
	questionId: string,
	data: UpdateQuestionRequest
): Promise<Question> {
	const response = await authenticatedFetch(
		`${BASE_URL}/exams/${examId}/questions/${questionId}`,
		{
			method: 'PATCH',
			body: JSON.stringify(data),
		}
	);

	return readData<Question>(response, 'Failed to update question');
}

export async function deleteQuestion(
	examId: string,
	questionId: string
): Promise<{ message: string }> {
	const response = await authenticatedFetch(
		`${BASE_URL}/exams/${examId}/questions/${questionId}`,
		{
			method: 'DELETE',
		}
	);

	if (!response.ok) {
		throw new Error(await readErrorMessage(response, 'Failed to delete question'));
	}

	return response.json();
}

export async function startExamAttempt(examId: string): Promise<ExamAttempt> {
	const response = await authenticatedFetch(`${BASE_URL}/exams/${examId}/start`, {
		method: 'POST',
	});

	return readData<ExamAttempt>(response, 'Failed to start exam attempt');
}

export async function submitExamAttempt(
	examId: string,
	data: SubmitAttemptRequest
): Promise<ExamAttempt> {
	const response = await authenticatedFetch(`${BASE_URL}/exams/${examId}/submit`, {
		method: 'POST',
		body: JSON.stringify(data),
	});

	return readData<ExamAttempt>(response, 'Failed to submit exam attempt');
}


// ============================================
// User Management API Functions
// ============================================

/**
 * Get all users (Admin only)
 * @param role - Optional role filter
 */
export async function getUsers(role?: UserRole): Promise<User[]> {
	const url = role 
		? `${BASE_URL}/users?role=${role}`
		: `${BASE_URL}/users`;
	
	const response = await authenticatedFetch(url);

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || 'Failed to fetch users');
	}

	const result = await response.json();
	return result.data;
}

/**
 * Get user by ID (Admin or the user themselves)
 * @param id - User ID
 */
export async function getUserById(id: string): Promise<User> {
	const response = await authenticatedFetch(`${BASE_URL}/users/${id}`);

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || 'Failed to fetch user');
	}

	const result = await response.json();
	return result.data;
}

/**
 * Create a new user (Admin only)
 * @param data - User creation data
 */
export async function createUser(data: CreateUserRequest): Promise<User> {
	const response = await authenticatedFetch(`${BASE_URL}/users`, {
		method: 'POST',
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || 'Failed to create user');
	}

	const result = await response.json();
	return result.data;
}

/**
 * Update user (Admin only)
 * @param id - User ID
 * @param data - Update data
 */
export async function updateUser(id: string, data: UpdateUserRequest): Promise<User> {
	const response = await authenticatedFetch(`${BASE_URL}/users/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || 'Failed to update user');
	}

	const result = await response.json();
	return result.data;
}

/**
 * Delete user (Admin only)
 * @param id - User ID
 */
export async function deleteUser(id: string): Promise<{ message: string }> {
	const response = await authenticatedFetch(`${BASE_URL}/users/${id}`, {
		method: 'DELETE',
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || 'Failed to delete user');
	}

	return response.json();
}

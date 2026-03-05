import { z } from 'zod';
import { UserRole } from './api';

export const createUserSchema = z.object({
	email: z.string().email('Invalid email address'),
	name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
	password: z.string().min(6, 'Password must be at least 6 characters'),
	role: z.nativeEnum(UserRole, {
		errorMap: () => ({ message: 'Invalid role' }),
	}).optional(),
});

export const updateUserSchema = z.object({
	email: z.string().email('Invalid email address').optional(),
	name: z.string().min(1, 'Name is required').max(100, 'Name is too long').optional(),
	password: z.string().min(6, 'Password must be at least 6 characters').optional(),
	role: z.nativeEnum(UserRole, {
		errorMap: () => ({ message: 'Invalid role' }),
	}).optional(),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;

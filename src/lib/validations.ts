import { z } from 'zod';
import { ExamStatus, QuestionType, UserRole } from './api';

export const createUserSchema = z.object({
	email: z.string().email('Invalid email address'),
	name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
	password: z.string().min(6, 'Password must be at least 6 characters'),
	role: z.nativeEnum(UserRole, {
		error: 'Invalid role',
	}).optional(),
});

export const updateUserSchema = z.object({
	email: z.string().email('Invalid email address').optional(),
	name: z.string().min(1, 'Name is required').max(100, 'Name is too long').optional(),
	password: z.string().min(6, 'Password must be at least 6 characters').optional(),
	role: z.nativeEnum(UserRole, {
		error: 'Invalid role',
	}).optional(),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;

const dateTimeStringSchema = z
	z.string()
	.min(1, 'Date and time is required')
	.refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date and time');


const examBaseSchema = z.object({
	title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
	description: z.string().min(1, 'Description is required').max(2000, 'Description is too long'),
	durationMinutes: z.coerce.number().int('Duration must be a whole number').positive('Duration must be greater than zero'),
	availabilityStart: z.string().optional(),
	availabilityEnd: z.string().optional(),
	status: z.nativeEnum(ExamStatus).optional(),
	instructorId: z.string().optional(),
});

export const createExamSchema = examBaseSchema.superRefine((data, ctx) => {
	if (data.availabilityStart && Number.isNaN(Date.parse(data.availabilityStart))) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['availabilityStart'],
			message: 'Invalid date and time',
		});
	}

	if (data.availabilityEnd && Number.isNaN(Date.parse(data.availabilityEnd))) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['availabilityEnd'],
			message: 'Invalid date and time',
		});
	}

	if (data.availabilityStart && data.availabilityEnd) {
		const start = new Date(data.availabilityStart);
		const end = new Date(data.availabilityEnd);

		if (start >= end) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['availabilityEnd'],
				message: 'End time must be after start time',
			});
		}
	}
});


export const updateExamSchema = z.object({
	title: z.string().min(1, 'Title is required').max(200, 'Title is too long').optional(),
	description: z.string().min(1, 'Description is required').max(2000, 'Description is too long').optional(),
	durationMinutes: z.coerce.number().int('Duration must be a whole number').positive('Duration must be greater than zero').optional(),
	availabilityStart: z.string().optional(),
	availabilityEnd: z.string().optional(),
	status: z.nativeEnum(ExamStatus).optional(),
	instructorId: z.string().optional(),
}).superRefine((data, ctx) => {
	if (data.availabilityStart && Number.isNaN(Date.parse(data.availabilityStart))) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['availabilityStart'],
			message: 'Invalid date and time',
		});
	}

	if (data.availabilityEnd && Number.isNaN(Date.parse(data.availabilityEnd))) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['availabilityEnd'],
			message: 'Invalid date and time',
		});
	}

	if (data.availabilityStart && data.availabilityEnd) {
		const start = new Date(data.availabilityStart);
		const end = new Date(data.availabilityEnd);

		if (start >= end) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['availabilityEnd'],
				message: 'End time must be after start time',
			});
		}
	}
});

const questionBaseSchema = z.object({
	order: z.coerce.number().int('Order must be a whole number').positive('Order must be greater than zero'),
	type: z.nativeEnum(QuestionType),
	questionText: z.string().min(1, 'Question text is required').max(4000, 'Question is too long'),
	options: z.array(z.string().min(1, 'Option cannot be empty')).min(2, 'At least two options are required'),
	correctAnswer: z.string().min(1, 'Correct answer is required'),
	points: z.coerce.number().int('Points must be a whole number').positive('Points must be greater than zero'),
});

export const questionSchema = questionBaseSchema.superRefine((data, ctx) => {
	if (!data.options.includes(data.correctAnswer)) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['correctAnswer'],
			message: 'Correct answer must match one of the options',
		});
	}

	if (data.type === QuestionType.TrueFalse && data.options.length !== 2) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['options'],
			message: 'True/False questions must have exactly two options',
		});
	}
});

export const updateQuestionSchema = z.object({
	order: z.coerce.number().int('Order must be a whole number').positive('Order must be greater than zero').optional(),
	type: z.nativeEnum(QuestionType).optional(),
	questionText: z.string().min(1, 'Question text is required').max(4000, 'Question is too long').optional(),
	options: z.array(z.string().min(1, 'Option cannot be empty')).min(2, 'At least two options are required').optional(),
	correctAnswer: z.string().min(1, 'Correct answer is required').optional(),
	points: z.coerce.number().int('Points must be a whole number').positive('Points must be greater than zero').optional(),
}).superRefine((data, ctx) => {
	if (data.correctAnswer && data.options && !data.options.includes(data.correctAnswer)) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['correctAnswer'],
			message: 'Correct answer must match one of the options',
		});
	}

	if (data.type === QuestionType.TrueFalse && data.options && data.options.length !== 2) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['options'],
			message: 'True/False questions must have exactly two options',
		});
	}
});

export type CreateExamFormData = z.infer<typeof createExamSchema>;
export type UpdateExamFormData = z.infer<typeof updateExamSchema>;
export type QuestionFormData = z.infer<typeof questionSchema>;
export type UpdateQuestionFormData = z.infer<typeof updateQuestionSchema>;

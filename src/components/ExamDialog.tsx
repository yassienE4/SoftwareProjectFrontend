'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	createExam,
	Exam,
	ExamStatus,
	Course,
	getMyCourses,
	getCurrentUser,
	updateExam,
	User,
} from '@/lib/api';
import {
	createExamSchema,
	CreateExamFormData,
} from '@/lib/validations';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface ExamDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSaved: () => void;
	exam?: Exam | null;
	instructorOptions?: User[];
}

function toLocalDateTime(value: string | null | undefined): string {
	if (!value) return '';
	const date = new Date(value);
	const offsetMinutes = date.getTimezoneOffset();
	const localDate = new Date(date.getTime() - offsetMinutes * 60000);
	return localDate.toISOString().slice(0, 16);
}

function toIsoDateTime(value: string | null | undefined): string | null {
	if (!value) return null;
	return new Date(value).toISOString();
}

const defaultValues: CreateExamFormData = {
	title: '',
	description: '',
	durationMinutes: 60,
	courseId: '',
	availabilityStart: '',
	availabilityEnd: '',
	status: ExamStatus.Draft,
	instructorId: '',
};

export default function ExamDialog({
	open,
	onOpenChange,
	onSaved,
	exam,
	instructorOptions = [],
}: ExamDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [courses, setCourses] = useState<Course[]>([]);
	const currentUser = getCurrentUser();
	const isEditMode = !!exam;
	const formId = isEditMode ? 'edit-exam-form' : 'create-exam-form';

	const form = useForm<CreateExamFormData>({
		resolver: zodResolver(createExamSchema) as any,
		defaultValues,
	});

	useEffect(() => {
		if (!open) return;
		setIsSubmitting(false);

		form.reset(
			exam
				? {
					title: exam.title,
					description: exam.description,
					durationMinutes: exam.durationMinutes,
					courseId: exam.courseId,
					availabilityStart: toLocalDateTime(exam.availabilityStart),
					availabilityEnd: toLocalDateTime(exam.availabilityEnd),
					status: exam.status,
					instructorId: exam.instructorId,
				}
				: defaultValues
		);
	}, [exam, form, open]);

	useEffect(() => {
		const loadCourses = async () => {
			try {
				const data = await getMyCourses();
				setCourses(data);
			} catch (error) {
				setCourses([]);
				toast.error(error instanceof Error ? error.message : 'Failed to load courses');
			}
		};

		loadCourses();
	}, []);

	const onSubmit = async (data: CreateExamFormData) => {
		try {
			setIsSubmitting(true);
			const payload = {
				title: data.title.trim(),
				description: data.description.trim(),
				durationMinutes: Number(data.durationMinutes),
				courseId: data.courseId,
				availabilityStart: toIsoDateTime(data.availabilityStart),
				availabilityEnd: toIsoDateTime(data.availabilityEnd),
				status: data.status ?? ExamStatus.Draft,
				instructorId: data.instructorId?.trim() || undefined,
			};

			if (isEditMode && exam) {
				await updateExam(exam.id, payload);
				toast.success('Exam updated successfully');
			} else {
				await createExam(payload);
				toast.success('Exam created successfully');
			}

			form.reset(defaultValues);
			onSaved();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to save exam');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleSaveClick = form.handleSubmit(onSubmit);

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen && !isSubmitting) {
			form.reset(defaultValues);
			setCourses([]);
		}
		onOpenChange(nextOpen);
	};

	const showInstructorField = currentUser?.role === 'Admin' && instructorOptions.length > 0;
	const showCourseField = courses.length > 0;

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-[640px]">
				<DialogHeader>
					<DialogTitle>{isEditMode ? 'Edit Exam' : 'Create Exam'}</DialogTitle>
					<DialogDescription>
						{isEditMode
							? 'Update the exam details, timing, and status.'
							: 'Create a new exam draft that you can publish after adding questions.'}
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="title"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Title</FormLabel>
									<FormControl>
										<Input placeholder="Midterm Exam" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Textarea placeholder="Chapter 1 through 5" className="min-h-32" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

									<FormField
										control={form.control}
										name="courseId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Course</FormLabel>
												<Select onValueChange={field.onChange} value={field.value} disabled={!showCourseField}>
													<FormControl>
														<SelectTrigger data-testid="exam-course-trigger">
															<SelectValue placeholder={showCourseField ? 'Select a course' : 'No courses available'} />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{courses.map((course) => (
															<SelectItem key={course.id} value={course.id} data-testid={`exam-course-${course.id}`}>
																{course.code} - {course.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<p className="text-xs text-muted-foreground">
													Select a course that already includes the assigned instructor.
												</p>
												<FormMessage />
											</FormItem>
										)}
									/>

						<div className="grid gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="durationMinutes"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Duration (minutes)</FormLabel>
										<FormControl>
											<Input type="number" min="1" step="1" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="status"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Status</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger data-testid="exam-status-trigger">
													<SelectValue placeholder="Select status" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
													<SelectItem value={ExamStatus.Draft} data-testid="exam-status-draft">Draft</SelectItem>
													<SelectItem value={ExamStatus.Published} data-testid="exam-status-published">Published</SelectItem>
													<SelectItem value={ExamStatus.Closed} data-testid="exam-status-closed">Closed</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="availabilityStart"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Availability Start</FormLabel>
										<FormControl>
											<Input type="datetime-local" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="availabilityEnd"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Availability End</FormLabel>
										<FormControl>
											<Input type="datetime-local" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{showInstructorField && (
							<FormField
								control={form.control}
								name="instructorId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Instructor</FormLabel>
										<Select onValueChange={field.onChange} value={field.value || ''}>
											<FormControl>
												<SelectTrigger data-testid="exam-instructor-trigger">
													<SelectValue placeholder="Assign to an instructor" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{instructorOptions.map((instructor) => (
													<SelectItem key={instructor.id} value={instructor.id} data-testid={`exam-instructor-${instructor.id}`}>
														{instructor.name} ({instructor.email})
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
								Cancel
							</Button>
							<Button type="submit" form={formId} disabled={isSubmitting}>
								{isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Exam'}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
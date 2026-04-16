'use client';

import { useEffect, useMemo, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
	Course,
	User,
	UserRole,
	createCourse,
	enrollUsersInCourse,
	getCourses,
	getUsers,
	removeUserFromCourse,
} from '@/lib/api';
import { Plus, RefreshCcw, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminCoursesPage() {
	return (
		<ProtectedRoute requiredRole={UserRole.Admin}>
			<AdminCoursesPageContent />
		</ProtectedRoute>
	);
}

function AdminCoursesPageContent() {
	const [courses, setCourses] = useState<Course[]>([]);
	const [users, setUsers] = useState<User[]>([]);
	const [loadingCourses, setLoadingCourses] = useState(true);
	const [loadingUsers, setLoadingUsers] = useState(true);
	const [selectedCourseId, setSelectedCourseId] = useState<string>('');
	const [courseCode, setCourseCode] = useState('');
	const [courseName, setCourseName] = useState('');
	const [courseDescription, setCourseDescription] = useState('');
	const [selectedInstructorId, setSelectedInstructorId] = useState('');
	const [selectedStudentId, setSelectedStudentId] = useState('');
	const [isCreating, setIsCreating] = useState(false);
	const [isUpdatingEnrollment, setIsUpdatingEnrollment] = useState(false);

	const fetchCourses = async () => {
		try {
			setLoadingCourses(true);
			const data = await getCourses();
			setCourses(data);
			if (!selectedCourseId && data.length > 0) {
				setSelectedCourseId(data[0].id);
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to fetch courses');
		} finally {
			setLoadingCourses(false);
		}
	};

	const fetchUsers = async () => {
		try {
			setLoadingUsers(true);
			const data = await getUsers();
			setUsers(data);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to fetch users');
		} finally {
			setLoadingUsers(false);
		}
	};

	useEffect(() => {
		void fetchCourses();
		void fetchUsers();
	}, []);

	useEffect(() => {
		if (!selectedCourseId && courses.length > 0) {
			setSelectedCourseId(courses[0].id);
		}
	}, [courses, selectedCourseId]);

	const selectedCourse = useMemo(
		() => courses.find((course) => course.id === selectedCourseId) ?? null,
		[courses, selectedCourseId]
	);

	const enrolledUserIds = selectedCourse?.enrolledUserIds ?? [];
	const enrolledUsers = useMemo(
		() => users.filter((user) => enrolledUserIds.includes(user.id)),
		[users, enrolledUserIds]
	);
	const availableInstructors = useMemo(
		() => users.filter((user) => user.role === UserRole.Instructor && !enrolledUserIds.includes(user.id)),
		[users, enrolledUserIds]
	);
	const availableStudents = useMemo(
		() => users.filter((user) => user.role === UserRole.Student && !enrolledUserIds.includes(user.id)),
		[users, enrolledUserIds]
	);

	const instructorCount = enrolledUsers.filter((user) => user.role === UserRole.Instructor).length;
	const studentCount = enrolledUsers.filter((user) => user.role === UserRole.Student).length;

	const handleCreateCourse = async () => {
		const code = courseCode.trim();
		const name = courseName.trim();
		const description = courseDescription.trim();

		if (!code || !name) {
			toast.error('Course code and name are required');
			return;
		}

		try {
			setIsCreating(true);
			const createdCourse = await createCourse({
				code,
				name,
				description: description || undefined,
			});
			toast.success('Course created successfully');
			setCourseCode('');
			setCourseName('');
			setCourseDescription('');
			await fetchCourses();
			setSelectedCourseId(createdCourse.id);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to create course');
		} finally {
			setIsCreating(false);
		}
	};

	const refreshAll = async () => {
		await Promise.all([fetchCourses(), fetchUsers()]);
	};

	const handleEnroll = async (userId: string) => {
		if (!selectedCourse) return;

		try {
			setIsUpdatingEnrollment(true);
			await enrollUsersInCourse(selectedCourse.id, { userId });
			toast.success('User enrolled successfully');
			await fetchCourses();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to enroll user');
		} finally {
			setIsUpdatingEnrollment(false);
		}
	};

	const handleRemove = async (userId: string) => {
		if (!selectedCourse) return;

		try {
			setIsUpdatingEnrollment(true);
			await removeUserFromCourse(selectedCourse.id, userId);
			toast.success('User removed from course');
			await fetchCourses();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to remove user');
		} finally {
			setIsUpdatingEnrollment(false);
		}
	};

	return (
		<div className="container mx-auto py-10 px-4 space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Course Management</h1>
					<p className="text-muted-foreground mt-1">
						Create courses and manage which instructors and students belong to them.
					</p>
				</div>
				<Button variant="outline" onClick={refreshAll} disabled={loadingCourses || loadingUsers}>
					<RefreshCcw className="mr-2 h-4 w-4" />
					Refresh
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Create Course</CardTitle>
					<CardDescription>Add a course before assigning exam visibility or enrollments.</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 md:grid-cols-[180px_1fr]">
					<div className="space-y-2">
						<Label htmlFor="course-code">Course Code</Label>
						<Input
							id="course-code"
							placeholder="CS101"
							value={courseCode}
							onChange={(event) => setCourseCode(event.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="course-name">Course Name</Label>
						<Input
							id="course-name"
							placeholder="Introduction to Computer Science"
							value={courseName}
							onChange={(event) => setCourseName(event.target.value)}
						/>
					</div>
					<div className="md:col-span-2 space-y-2">
						<Label htmlFor="course-description">Description</Label>
						<Textarea
							id="course-description"
							placeholder="Optional course description"
							value={courseDescription}
							onChange={(event) => setCourseDescription(event.target.value)}
						/>
					</div>
					<div className="md:col-span-2 flex justify-end">
						<Button onClick={handleCreateCourse} disabled={isCreating}>
							<Plus className="mr-2 h-4 w-4" />
							{isCreating ? 'Creating...' : 'Create Course'}
						</Button>
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-6 lg:grid-cols-[420px_1fr]">
				<Card>
					<CardHeader>
						<CardTitle>Courses</CardTitle>
						<CardDescription>Select a course to manage enrollments.</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Code</TableHead>
										<TableHead>Name</TableHead>
										<TableHead>Enrollments</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{loadingCourses ? (
										Array.from({ length: 4 }).map((_, index) => (
											<TableRow key={index}>
												<TableCell><Skeleton className="h-4 w-16" /></TableCell>
												<TableCell><Skeleton className="h-4 w-40" /></TableCell>
												<TableCell><Skeleton className="h-4 w-20" /></TableCell>
											</TableRow>
										))
									) : courses.length === 0 ? (
										<TableRow>
											<TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
												No courses found
											</TableCell>
										</TableRow>
									) : (
										courses.map((course) => {
											const enrolledCount = course.enrolledUserIds?.length ?? 0;
											const isSelected = course.id === selectedCourseId;

											return (
												<TableRow
													key={course.id}
													className={isSelected ? 'bg-muted/50' : undefined}
													onClick={() => setSelectedCourseId(course.id)}
												>
													<TableCell className="font-medium">{course.code}</TableCell>
													<TableCell>{course.name}</TableCell>
													<TableCell>
														<Badge variant="secondary">{enrolledCount}</Badge>
													</TableCell>
												</TableRow>
											);
										})
									)}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center justify-between gap-4">
							{selectedCourse ? (
								<span>
									{selectedCourse.code} - {selectedCourse.name}
								</span>
							) : (
								'Select a course'
							)}
							<Badge variant="outline" className="gap-2">
								<Users className="h-3.5 w-3.5" />
								{instructorCount} instructors, {studentCount} students
							</Badge>
						</CardTitle>
						<CardDescription>
							{selectedCourse
								? selectedCourse.description || 'No description provided.'
								: 'Choose a course to manage enrollments.'}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{!selectedCourse ? (
							<p className="text-sm text-muted-foreground">Pick a course from the list to continue.</p>
						) : (
							<>
								<div className="grid gap-4 md:grid-cols-2">
									<Card className="border-dashed">
										<CardHeader className="pb-3">
											<CardTitle className="text-base">Add Instructor</CardTitle>
											<CardDescription>Only instructors not already in the course are listed.</CardDescription>
										</CardHeader>
										<CardContent className="space-y-3">
											<select
												className="w-full rounded-md border bg-background px-3 py-2 text-sm"
												value={selectedInstructorId}
												onChange={(event) => setSelectedInstructorId(event.target.value)}
												disabled={loadingUsers || availableInstructors.length === 0 || isUpdatingEnrollment}
											>
												<option value="">Select instructor</option>
												{availableInstructors.map((user) => (
													<option key={user.id} value={user.id}>
														{user.name} ({user.email})
													</option>
												))}
											</select>
											<Button
												variant="outline"
												className="w-full"
												onClick={async () => {
													if (!selectedInstructorId) return;
													await handleEnroll(selectedInstructorId);
													setSelectedInstructorId('');
												}}
												disabled={!selectedInstructorId || isUpdatingEnrollment || loadingUsers}
											>
												Enroll Instructor
											</Button>
										</CardContent>
									</Card>

									<Card className="border-dashed">
										<CardHeader className="pb-3">
											<CardTitle className="text-base">Add Student</CardTitle>
											<CardDescription>Only students not already in the course are listed.</CardDescription>
										</CardHeader>
										<CardContent className="space-y-3">
											<select
												className="w-full rounded-md border bg-background px-3 py-2 text-sm"
												value={selectedStudentId}
												onChange={(event) => setSelectedStudentId(event.target.value)}
												disabled={loadingUsers || availableStudents.length === 0 || isUpdatingEnrollment}
											>
												<option value="">Select student</option>
												{availableStudents.map((user) => (
													<option key={user.id} value={user.id}>
														{user.name} ({user.email})
													</option>
												))}
											</select>
											<Button
												variant="outline"
												className="w-full"
												onClick={async () => {
													if (!selectedStudentId) return;
													await handleEnroll(selectedStudentId);
													setSelectedStudentId('');
												}}
												disabled={!selectedStudentId || isUpdatingEnrollment || loadingUsers}
											>
												Enroll Student
											</Button>
										</CardContent>
									</Card>
								</div>

								<div className="space-y-3">
									<div className="flex items-center justify-between gap-3">
										<div>
											<h3 className="text-lg font-semibold">Current Enrollments</h3>
											<p className="text-sm text-muted-foreground">
												Remove instructors or students from the selected course.
											</p>
										</div>
										<Badge variant="outline">{enrolledUsers.length} users</Badge>
									</div>

									<div className="rounded-md border">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Name</TableHead>
													<TableHead>Email</TableHead>
													<TableHead>Role</TableHead>
													<TableHead className="text-right">Actions</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{loadingUsers ? (
													Array.from({ length: 4 }).map((_, index) => (
														<TableRow key={index}>
															<TableCell><Skeleton className="h-4 w-40" /></TableCell>
															<TableCell><Skeleton className="h-4 w-52" /></TableCell>
															<TableCell><Skeleton className="h-5 w-20" /></TableCell>
															<TableCell className="text-right"><Skeleton className="ml-auto h-8 w-8" /></TableCell>
														</TableRow>
													))
												) : enrolledUsers.length === 0 ? (
													<TableRow>
														<TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
															No users enrolled yet
														</TableCell>
													</TableRow>
												) : (
													enrolledUsers.map((user) => (
														<TableRow key={user.id}>
															<TableCell className="font-medium">{user.name}</TableCell>
															<TableCell>{user.email}</TableCell>
															<TableCell>
																<Badge variant={user.role === UserRole.Instructor ? 'default' : 'secondary'}>{user.role}</Badge>
															</TableCell>
															<TableCell className="text-right">
																<Button
																	variant="ghost"
																	size="icon"
																	onClick={() => handleRemove(user.id)}
																	disabled={isUpdatingEnrollment}
																>
																	<Trash2 className="h-4 w-4" />
																</Button>
																</TableCell>
														</TableRow>
													))
												)}
											</TableBody>
										</Table>
									</div>
								</div>
							</>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

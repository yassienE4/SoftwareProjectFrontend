'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, ArrowRight, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import {
	Exam,
	ExamStatus,
	getCurrentUser,
	getExams,
	getUsers,
	User,
	UserRole,
} from '@/lib/api';
import ExamDialog from '@/components/ExamDialog';
import DeleteExamDialog from '@/components/DeleteExamDialog';

export default function ExamsPage() {
	return (
		<ProtectedRoute>
			<ExamsPageContent />
		</ProtectedRoute>
	);
}

function ExamsPageContent() {
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [exams, setExams] = useState<Exam[]>([]);
	const [instructors, setInstructors] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState<ExamStatus | 'all'>('all');
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

	useEffect(() => {
		setCurrentUser(getCurrentUser());
	}, []);

	useEffect(() => {
		const fetchExams = async () => {
			try {
				setLoading(true);
				const data = await getExams();
				setExams(data);
			} catch (error) {
				toast.error(error instanceof Error ? error.message : 'Failed to fetch exams');
			} finally {
				setLoading(false);
			}
		};

		fetchExams();
	}, [statusFilter]);

	useEffect(() => {
		const fetchInstructors = async () => {
			if (currentUser?.role !== UserRole.Admin) {
				setInstructors([]);
				return;
			}

			try {
				const data = await getUsers(UserRole.Instructor);
				setInstructors(data);
			} catch (error) {
				toast.error(error instanceof Error ? error.message : 'Failed to load instructors');
			}
		};

		fetchInstructors();
	}, [currentUser]);

	const visibleExams = exams.filter((exam) => statusFilter === 'all' ? true : exam.status === statusFilter);

	const canManageExams = currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.Instructor;

	const handleEdit = (exam: Exam) => {
		setSelectedExam(exam);
		setEditDialogOpen(true);
	};

	const handleDelete = (exam: Exam) => {
		setSelectedExam(exam);
		setDeleteDialogOpen(true);
	};

	const handleSaved = () => {
		setCreateDialogOpen(false);
		setEditDialogOpen(false);
		setDeleteDialogOpen(false);
		setSelectedExam(null);
		getExams()
			.then(setExams)
			.catch((error) => toast.error(error instanceof Error ? error.message : 'Failed to refresh exams'));
	};

	const getStatusVariant = (status: ExamStatus) => {
		switch (status) {
			case ExamStatus.Published:
				return 'default';
			case ExamStatus.Closed:
				return 'secondary';
			default:
				return 'outline';
		}
	};

	return (
		<div className="container mx-auto py-10 px-4">
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Exams</h1>
						<p className="text-muted-foreground mt-1">
							Manage exams, publish content, and review student access.
						</p>
					</div>
					{canManageExams && (
						<Button onClick={() => setCreateDialogOpen(true)}>
							<Plus className="mr-2 h-4 w-4" />
							Create Exam
						</Button>
					)}
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Exam Library</CardTitle>
						<CardDescription>
							{currentUser?.role === UserRole.Student
								? 'Published exams for courses you are enrolled in'
								: 'Exams visible to your role and course access'}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center gap-4">
							<label className="text-sm font-medium">Filter by status:</label>
							<Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ExamStatus | 'all')}>
								<SelectTrigger className="w-[200px]" data-testid="exam-status-filter-trigger">
									<SelectValue placeholder="All statuses" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all" data-testid="exam-status-filter-all">All statuses</SelectItem>
									<SelectItem value={ExamStatus.Draft} data-testid="exam-status-filter-draft">Draft</SelectItem>
									<SelectItem value={ExamStatus.Published} data-testid="exam-status-filter-published">Published</SelectItem>
									<SelectItem value={ExamStatus.Closed} data-testid="exam-status-filter-closed">Closed</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Title</TableHead>
										<TableHead>Course</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Duration</TableHead>
										<TableHead>Availability</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{loading ? (
										Array.from({ length: 5 }).map((_, index) => (
											<TableRow key={index}>
												<TableCell><Skeleton className="h-4 w-[180px]" /></TableCell>
												<TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
												<TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
												<TableCell><Skeleton className="h-4 w-[160px]" /></TableCell>
												<TableCell className="text-right"><Skeleton className="h-8 w-[120px] ml-auto" /></TableCell>
											</TableRow>
										))
									) : visibleExams.length === 0 ? (
										<TableRow>
											<TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
												No exams found
											</TableCell>
										</TableRow>
									) : (
										visibleExams.map((exam) => (
											<TableRow key={exam.id}>
												<TableCell>
													<div className="flex items-center gap-3">
														<div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
															<BookOpen className="h-4 w-4" />
														</div>
														<div>
															<p className="font-medium">{exam.title}</p>
															<p className="text-sm text-muted-foreground line-clamp-1">{exam.description}</p>
														</div>
													</div>
												</TableCell>
												<TableCell>
													<p className="text-sm text-muted-foreground">Course ID: {exam.courseId}</p>
												</TableCell>
												<TableCell>
													<Badge variant={getStatusVariant(exam.status)}>{exam.status}</Badge>
												</TableCell>
												<TableCell>{exam.durationMinutes} min</TableCell>
												<TableCell>
													<div className="text-sm text-muted-foreground">
														<div>Start: {exam.availabilityStart ? new Date(exam.availabilityStart).toLocaleString() : 'Any time'}</div>
														<div>End: {exam.availabilityEnd ? new Date(exam.availabilityEnd).toLocaleString() : 'No end date'}</div>
													</div>
												</TableCell>
												<TableCell className="text-right">
													<div className="flex items-center justify-end gap-2">
														<Button variant="outline" size="sm" asChild>
															<Link href={`/exams/${exam.id}`}>
																Open
																<ArrowRight className="ml-2 h-4 w-4" />
															</Link>
														</Button>
														{canManageExams && (
															<>
																<Button variant="ghost" size="icon" onClick={() => handleEdit(exam)}>
																	<Pencil className="h-4 w-4" />
																</Button>
																<Button variant="ghost" size="icon" onClick={() => handleDelete(exam)}>
																	<Trash2 className="h-4 w-4" />
																</Button>
															</>
														)}
													</div>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			</div>

			{canManageExams && (
				<ExamDialog
					open={createDialogOpen}
					onOpenChange={setCreateDialogOpen}
					onSaved={handleSaved}
					instructorOptions={instructors}
				/>
			)}

			{selectedExam && (
				<>
					<ExamDialog
						open={editDialogOpen}
						onOpenChange={setEditDialogOpen}
						onSaved={handleSaved}
						exam={selectedExam}
						instructorOptions={instructors}
					/>
					<DeleteExamDialog
						open={deleteDialogOpen}
						onOpenChange={setDeleteDialogOpen}
						exam={selectedExam}
						onDeleted={handleSaved}
					/>
				</>
			)}
		</div>
	);
}
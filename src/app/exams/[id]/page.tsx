'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
	AttemptStatus,
	deleteQuestion,
	Exam,
	ExamStatus,
	getCurrentUser,
	getExamById,
	getExamQuestions,
	Question,
	startExamAttempt,
	submitExamAttempt,
	User,
	UserRole,
} from '@/lib/api';
import ExamDialog from '@/components/ExamDialog';
import QuestionDialog from '@/components/QuestionDialog';
import DeleteExamDialog from '@/components/DeleteExamDialog';
import { Pencil, Plus, Trash2, Timer, Play, Send, ArrowLeft, BookOpen } from 'lucide-react';

type SubmittedAttemptSnapshot = {
	score: number | null;
	submittedAt: string;
	answersCount: number;
};

function formatAvailability(value: string | null): string {
	return value ? new Date(value).toLocaleString() : 'Any time';
}

function isPublishedAndAvailable(exam: Exam): boolean {
	const now = new Date();
	const start = exam.availabilityStart ? new Date(exam.availabilityStart) : null;
	const end = exam.availabilityEnd ? new Date(exam.availabilityEnd) : null;

	if (exam.status !== ExamStatus.Published) return false;
	if (start && now < start) return false;
	if (end && now > end) return false;
	return true;
}

function getDeadline(exam: Exam, startedAt: string | null): Date | null {
	if (!startedAt) return null;

	const durationDeadline = new Date(new Date(startedAt).getTime() + exam.durationMinutes * 60 * 1000);
	if (exam.availabilityEnd) {
		const availabilityDeadline = new Date(exam.availabilityEnd);
		return durationDeadline < availabilityDeadline ? durationDeadline : availabilityDeadline;
	}

	return durationDeadline;
}

function secondsRemaining(deadline: Date | null): number {
	if (!deadline) return 0;
	return Math.max(0, Math.floor((deadline.getTime() - Date.now()) / 1000));
}

function getAttemptStorageKey(examId: string, userId: string | null): string {
	return `exam-attempt:${examId}:${userId ?? 'anonymous'}`;
}

function isAccessDeniedError(error: unknown): boolean {
	const message = error instanceof Error ? error.message : String(error);
	const normalizedMessage = message.toLowerCase();
	return (
		normalizedMessage.includes('access denied') ||
		normalizedMessage.includes('forbidden') ||
		normalizedMessage.includes('not enrolled') ||
		normalizedMessage.includes('403')
	);
}

export default function ExamDetailPage() {
	return (
		<ProtectedRoute>
			<ExamDetailContent />
		</ProtectedRoute>
	);
}

function ExamDetailContent() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const examId = params.id;
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [exam, setExam] = useState<Exam | null>(null);
	const [questions, setQuestions] = useState<Question[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [accessDenied, setAccessDenied] = useState(false);
	const [editExamOpen, setEditExamOpen] = useState(false);
	const [deleteExamOpen, setDeleteExamOpen] = useState(false);
	const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
	const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
	const [attemptStarted, setAttemptStarted] = useState(false);
	const [attemptSubmitted, setAttemptSubmitted] = useState(false);
	const [attemptScore, setAttemptScore] = useState<number | null>(null);
	const [submittedAt, setSubmittedAt] = useState<string | null>(null);
	const [submittedAnswersCount, setSubmittedAnswersCount] = useState(0);
	const [startedAt, setStartedAt] = useState<string | null>(null);
	const [timeRemaining, setTimeRemaining] = useState(0);
	const [answers, setAnswers] = useState<Record<string, string>>({});

	useEffect(() => {
		setCurrentUser(getCurrentUser());
	}, []);

	useEffect(() => {
		if (!currentUser || !exam) return;

		try {
			const savedAttempt = localStorage.getItem(getAttemptStorageKey(exam.id, currentUser.id));
			if (!savedAttempt) return;

			const parsed = JSON.parse(savedAttempt) as SubmittedAttemptSnapshot;
			setAttemptStarted(true);
			setAttemptSubmitted(true);
			setAttemptScore(parsed.score);
			setSubmittedAt(parsed.submittedAt);
			setSubmittedAnswersCount(parsed.answersCount);
		} catch {
			localStorage.removeItem(getAttemptStorageKey(exam.id, currentUser.id));
		}
	}, [currentUser, exam]);

	useEffect(() => {
		const loadExam = async () => {
			try {
				setLoading(true);
				setError(null);
				setAccessDenied(false);
				const examData = await getExamById(examId);
				setExam(examData);
				const questionData = await getExamQuestions(examId);
				setQuestions(questionData.sort((left, right) => left.order - right.order));
			} catch (loadError) {
				if (isAccessDeniedError(loadError)) {
					setAccessDenied(true);
					setQuestions([]);
					return;
				}

				const message = loadError instanceof Error ? loadError.message : 'Failed to load exam';
				setError(message);
				toast.error(message);
			} finally {
				setLoading(false);
			}
		};

		if (examId) {
			loadExam();
		}
	}, [examId]);

	useEffect(() => {
		if (!attemptStarted || attemptSubmitted || !startedAt || !exam) return;

		const deadline = getDeadline(exam, startedAt);
		const tick = () => setTimeRemaining(secondsRemaining(deadline));

		tick();
		const interval = window.setInterval(tick, 1000);
		return () => window.clearInterval(interval);
	}, [attemptStarted, attemptSubmitted, exam, startedAt]);

	const canManage = currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.Instructor;
	const examAvailable = exam ? isPublishedAndAvailable(exam) : false;
	const deadline = exam ? getDeadline(exam, startedAt) : null;

	const formattedDeadline = useMemo(() => {
		if (!deadline) return null;
		return deadline.toLocaleString();
	}, [deadline]);

	const nextQuestionOrder = useMemo(() => {
		if (questions.length === 0) return 1;
		return Math.max(...questions.map((question) => question.order)) + 1;
	}, [questions]);

	const handleOpenQuestionDialog = (question?: Question) => {
		setSelectedQuestion(question ?? null);
		setQuestionDialogOpen(true);
	};

	const refreshQuestions = async () => {
		if (!exam) return;
		const questionData = await getExamQuestions(exam.id);
		setQuestions(questionData.sort((left, right) => left.order - right.order));
	};

	const handleDeleteQuestion = async (question: Question) => {
		if (!exam) return;
		try {
			await deleteQuestion(exam.id, question.id);
			toast.success('Question deleted successfully');
			await refreshQuestions();
		} catch (deleteError) {
			toast.error(deleteError instanceof Error ? deleteError.message : 'Failed to delete question');
		}
	};

	const handleStartAttempt = async () => {
		if (!exam) return;
		try {
			const attempt = await startExamAttempt(exam.id);
			setAttemptStarted(true);
			setAttemptSubmitted(attempt.status === AttemptStatus.Submitted);
			setStartedAt(attempt.startedAt);
			setAttemptScore(attempt.score);
			toast.success('Exam attempt started');
		} catch (startError) {
			if (isAccessDeniedError(startError)) {
				setAccessDenied(true);
				toast.error('You are not enrolled in this course');
				return;
			}

			const message = startError instanceof Error ? startError.message : 'Failed to start exam';
			if (message.toLowerCase().includes('attempt')) {
				setAttemptStarted(true);
				toast.info('Using the existing attempt for this exam');
				return;
			}
			toast.error(message);
		}
	};

	const handleAnswerChange = (questionId: string, answer: string) => {
		setAnswers((current) => ({ ...current, [questionId]: answer }));
	};

	const handleSubmitAttempt = async () => {
		if (!exam) return;
		try {
			const attempt = await submitExamAttempt(exam.id, { answers });
			const snapshot: SubmittedAttemptSnapshot = {
				score: attempt.score,
				submittedAt: attempt.submittedAt ?? new Date().toISOString(),
				answersCount: Object.keys(answers).length,
			};
			if (currentUser) {
				localStorage.setItem(getAttemptStorageKey(exam.id, currentUser.id), JSON.stringify(snapshot));
			}
			setAttemptSubmitted(true);
			setAttemptScore(attempt.score);
			setSubmittedAt(snapshot.submittedAt);
			setSubmittedAnswersCount(snapshot.answersCount);
			toast.success('Exam submitted successfully');
		} catch (submitError) {
			toast.error(submitError instanceof Error ? submitError.message : 'Failed to submit exam');
		}
	};

	const updateExamData = async () => {
		if (!exam) return;
		const examData = await getExamById(exam.id);
		setExam(examData);
		await refreshQuestions();
	};

	if (loading) {
		return (
			<div className="container mx-auto py-10 px-4 space-y-6">
				<Skeleton className="h-8 w-40" />
				<Skeleton className="h-48 w-full" />
				<Skeleton className="h-80 w-full" />
			</div>
		);
	}

	if (accessDenied) {
		return (
			<div className="container mx-auto py-10 px-4">
				<Card>
					<CardHeader>
						<CardTitle className="text-destructive">Access denied</CardTitle>
						<CardDescription>
							{exam
								? `You are not enrolled in the course for "${exam.title}".`
								: 'You are not enrolled in the course for this exam.'}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button variant="outline" onClick={() => router.push('/exams')}>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to exams
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (error || !exam) {
		return (
			<div className="container mx-auto py-10 px-4">
				<Card>
					<CardHeader>
						<CardTitle className="text-destructive">Exam unavailable</CardTitle>
						<CardDescription>{error || 'The exam could not be loaded.'}</CardDescription>
					</CardHeader>
					<CardContent>
						<Button variant="outline" onClick={() => router.push('/exams')}>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to exams
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-10 px-4 space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-2">
					<Button variant="ghost" className="w-fit pl-0" onClick={() => router.push('/exams')}>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to exams
					</Button>
					<div className="flex items-center gap-3">
						<BookOpen className="h-5 w-5 text-muted-foreground" />
						<h1 className="text-3xl font-bold tracking-tight">{exam.title}</h1>
						<Badge variant={exam.status === ExamStatus.Published ? 'default' : exam.status === ExamStatus.Closed ? 'secondary' : 'outline'}>
							{exam.status}
						</Badge>
					</div>
					<p className="text-muted-foreground max-w-3xl">{exam.description}</p>
				</div>
				{canManage && (
	<div className="flex flex-wrap gap-2">

		<Button
			variant="secondary"
			onClick={() => router.push(`/exams/${exam.id}/analytics`)}
		>
			View Analytics
		</Button>

		<Button variant="outline" onClick={() => setEditExamOpen(true)}>
			<Pencil className="mr-2 h-4 w-4" />
			Edit Exam
		</Button>

		<Button variant="destructive" onClick={() => setDeleteExamOpen(true)}>
			<Trash2 className="mr-2 h-4 w-4" />
			Delete Exam
		</Button>

	</div>
)}
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Exam Details</CardTitle>
					<CardDescription>Timing, visibility, and scoring setup.</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
					<div>
						<p className="text-sm text-muted-foreground">Duration</p>
						<p className="font-medium">{exam.durationMinutes} minutes</p>
					</div>
						<div>
							<p className="text-sm text-muted-foreground">Course</p>
							<p className="font-medium">{exam.courseId}</p>
						</div>
					<div>
						<p className="text-sm text-muted-foreground">Availability Start</p>
						<p className="font-medium">{formatAvailability(exam.availabilityStart)}</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">Availability End</p>
						<p className="font-medium">{formatAvailability(exam.availabilityEnd)}</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">Timer</p>
						<p className="font-medium">{deadline ? `${timeRemaining}s remaining` : 'Not started'}</p>
						{formattedDeadline && <p className="text-xs text-muted-foreground">Ends at {formattedDeadline}</p>}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between gap-4">
						Questions
						{canManage && (
							<Button onClick={() => handleOpenQuestionDialog()}>
								<Plus className="mr-2 h-4 w-4" />
								Add Question
							</Button>
						)}
					</CardTitle>
					<CardDescription>
						{canManage
							? 'Manage the ordered questions for this exam.'
							: 'Answer the questions below and submit your attempt.'}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{questions.length === 0 ? (
						<p className="text-sm text-muted-foreground">No questions added yet.</p>
					) : canManage ? (
						<div className="space-y-3">
							{questions.map((question) => (
								<div key={question.id} className="rounded-lg border p-4 space-y-3">
									<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
										<div className="space-y-1">
											<div className="flex flex-wrap items-center gap-2">
												<Badge variant="outline">#{question.order}</Badge>
												<Badge variant="secondary">{question.type}</Badge>
												<Badge variant="outline">{question.points} pts</Badge>
											</div>
											<p className="font-medium">{question.questionText}</p>
										</div>
										<div className="flex gap-2">
											<Button variant="ghost" size="icon" onClick={() => handleOpenQuestionDialog(question)}>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(question)}>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</div>
									<div className="grid gap-2 sm:grid-cols-2">
										{question.options.map((option) => (
											<div key={option} className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
												{option}
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="space-y-4">
							{!attemptStarted ? (
								<div className="rounded-lg border bg-muted/30 p-4 space-y-3">
									<p className="text-sm text-muted-foreground">
										{exam.status !== ExamStatus.Published
											? 'This exam is not published yet.'
											: examAvailable
												? 'This exam is ready. Start your attempt when you are ready.'
												: 'This exam is outside the available window.'}
									</p>
									<Button onClick={handleStartAttempt} disabled={!examAvailable}>
										<Play className="mr-2 h-4 w-4" />
										Start Exam
									</Button>
								</div>
							) : null}

							{attemptStarted && (
								<div className="space-y-4">
									{attemptSubmitted ? (
										<Card className="border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/30">
											<CardContent className="pt-6 space-y-5">
												<div className="flex items-start justify-between gap-4">
													<div className="space-y-2">
														<p className="text-sm font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
															Exam submitted
														</p>
														<h3 className="text-2xl font-semibold text-foreground">
															Your attempt is complete
														</h3>
														<p className="text-sm text-muted-foreground">
															You can review the summary below. Answers are locked after submission.
														</p>
													</div>
													<Badge variant="secondary" className="text-sm">
														Score: {attemptScore ?? 'Pending'}
													</Badge>
												</div>

												<div className="grid gap-4 sm:grid-cols-3">
													<div className="rounded-lg border bg-background/80 p-4">
														<p className="text-xs uppercase tracking-wide text-muted-foreground">Score</p>
														<p className="mt-1 text-2xl font-semibold">{attemptScore ?? 'Pending'}</p>
													</div>
													<div className="rounded-lg border bg-background/80 p-4">
														<p className="text-xs uppercase tracking-wide text-muted-foreground">Submitted at</p>
														<p className="mt-1 text-sm font-medium">
															{submittedAt ? new Date(submittedAt).toLocaleString() : 'Just now'}
														</p>
													</div>
													<div className="rounded-lg border bg-background/80 p-4">
														<p className="text-xs uppercase tracking-wide text-muted-foreground">Answered</p>
														<p className="mt-1 text-sm font-medium">
																{submittedAnswersCount} / {questions.length}
														</p>
													</div>
												</div>

												<div className="rounded-lg border bg-background/80 p-4">
													<p className="text-sm font-medium">What happens next</p>
													<p className="mt-1 text-sm text-muted-foreground">
														Your submission has been recorded. If your course supports results review, that screen can be added next.
													</p>
												</div>

												<div className="flex flex-wrap gap-3">
													<Button variant="outline" onClick={() => router.push('/exams')}>
														<ArrowLeft className="mr-2 h-4 w-4" />
														Back to exams
													</Button>
												</div>
										</CardContent>
									</Card>
									) : (
										<>
											{questions.map((question) => (
												<div key={question.id} className="rounded-lg border p-4 space-y-3">
													<div className="flex flex-wrap items-center gap-2">
														<Badge variant="outline">#{question.order}</Badge>
														<Badge variant="secondary">{question.type}</Badge>
														<Badge variant="outline">{question.points} pts</Badge>
													</div>
													<p className="font-medium">{question.questionText}</p>
													<div className="space-y-2">
														{question.options.map((option) => (
															<label key={option} className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
																<input
																	type="radio"
																	name={`question-${question.id}`}
																	value={option}
																	checked={answers[question.id] === option}
																	onChange={() => handleAnswerChange(question.id, option)}
																/>
																<span>{option}</span>
															</label>
														))}
													</div>
												</div>
											))}
											<div className="flex justify-end">
												<Button onClick={handleSubmitAttempt}>
													<Send className="mr-2 h-4 w-4" />
													Submit Exam
												</Button>
											</div>
										</>
									)}
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			{canManage && (
				<ExamDialog
					open={editExamOpen}
					onOpenChange={setEditExamOpen}
					onSaved={async () => {
						setEditExamOpen(false);
						await updateExamData();
					}}
					exam={exam}
				/>
			)}

			{canManage && (
				<QuestionDialog
					examId={exam.id}
					open={questionDialogOpen}
					onOpenChange={setQuestionDialogOpen}
					onSaved={async () => {
						setQuestionDialogOpen(false);
						setSelectedQuestion(null);
						await refreshQuestions();
					}}
					initialOrder={nextQuestionOrder}
					question={selectedQuestion}
				/>
			)}

			{canManage && (
				<DeleteExamDialog
					open={deleteExamOpen}
					onOpenChange={setDeleteExamOpen}
					exam={exam}
					onDeleted={async () => {
						setDeleteExamOpen(false);
						router.push('/exams');
					}}
				/>
			)}
		</div>
	);
}
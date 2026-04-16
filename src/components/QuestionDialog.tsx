'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	Question,
	QuestionType,
	createQuestion,
	updateQuestion,
} from '@/lib/api';
import {
	questionSchema,
	QuestionFormData,
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

interface QuestionDialogProps {
	examId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSaved: () => void;
	initialOrder?: number;
	question?: Question | null;
}

function padOptions(options: string[], type: QuestionType): string[] {
	if (type === QuestionType.TrueFalse) {
		return ['True', 'False'];
	}

	const padded = [...options];
	while (padded.length < 4) {
		padded.push('');
	}
	return padded.slice(0, 4);
}

const defaultValues: QuestionFormData = {
	order: 1,
	type: QuestionType.MCQ,
	questionText: '',
	options: ['', '', '', ''],
	correctAnswer: '',
	points: 1,
};

export default function QuestionDialog({
	examId,
	open,
	onOpenChange,
	onSaved,
	initialOrder = 1,
	question,
}: QuestionDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const isEditMode = !!question;

	const form = useForm<QuestionFormData>({
		resolver: zodResolver(questionSchema) as any,
		defaultValues,
	});

	const questionType = form.watch('type');
	const optionValues = form.watch('options');

	useEffect(() => {
		if (!open) return;

		const initialType = question?.type ?? QuestionType.MCQ;
		const initialOptions = padOptions(question?.options ?? [], initialType);
		const initialCorrectAnswer =
			question?.correctAnswer && initialOptions.includes(question.correctAnswer)
				? question.correctAnswer
				: initialType === QuestionType.TrueFalse
					? 'True'
					: initialOptions.find((item) => item.trim().length > 0) || '';

		form.reset(
			question
				? {
					order: question.order,
					type: question.type,
					questionText: question.questionText,
					options: initialOptions,
					correctAnswer: initialCorrectAnswer,
					points: question.points,
				}
				: {
					...defaultValues,
					order: initialOrder,
				}
		);
	}, [form, initialOrder, open, question]);

	const handleTypeChange = (nextType: QuestionType) => {
		form.setValue('type', nextType, { shouldValidate: true });

		if (nextType === QuestionType.TrueFalse) {
			form.setValue('options', ['True', 'False'], { shouldValidate: true });
			form.setValue('correctAnswer', 'True', { shouldValidate: true });
			return;
		}

		const paddedOptions = padOptions(optionValues, nextType);
		form.setValue('options', paddedOptions, { shouldValidate: true });

		if (!paddedOptions.includes(form.getValues('correctAnswer'))) {
			form.setValue('correctAnswer', paddedOptions.find((item) => item.trim().length > 0) || '', {
				shouldValidate: true,
			});
		}
	};

	const onSubmit = async (data: QuestionFormData) => {
		try {
			setIsSubmitting(true);
			const payload = {
				order: Number(data.order),
				type: data.type,
				questionText: data.questionText.trim(),
				options: data.options.map((option) => option.trim()),
				correctAnswer: data.correctAnswer.trim(),
				points: Number(data.points),
			};

			if (isEditMode && question) {
				await updateQuestion(examId, question.id, payload);
				toast.success('Question updated successfully');
			} else {
				await createQuestion(examId, payload);
				toast.success('Question created successfully');
			}

			onSaved();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to save question');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen && !isSubmitting) {
			form.reset({
				...defaultValues,
				order: initialOrder,
			});
		}
		onOpenChange(nextOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-[700px]">
				<DialogHeader>
					<DialogTitle>{isEditMode ? 'Edit Question' : 'Add Question'}</DialogTitle>
					<DialogDescription>
						Define the question text, answer options, and scoring.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<div className="grid gap-4 md:grid-cols-3">
							<FormField
								control={form.control}
								name="order"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Order</FormLabel>
										<FormControl>
											<Input type="number" min="1" step="1" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="points"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Points</FormLabel>
										<FormControl>
											<Input type="number" min="1" step="1" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="type"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Type</FormLabel>
										<Select onValueChange={handleTypeChange} value={field.value}>
											<FormControl>
												<SelectTrigger data-testid="question-type-trigger">
													<SelectValue placeholder="Select type" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
													<SelectItem value={QuestionType.MCQ} data-testid="question-type-mcq">MCQ</SelectItem>
													<SelectItem value={QuestionType.TrueFalse} data-testid="question-type-truefalse">True/False</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="questionText"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Question Text</FormLabel>
									<FormControl>
										<Textarea className="min-h-32" placeholder="Enter the question prompt" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="space-y-3 rounded-lg border p-4">
							<div>
								<h4 className="text-sm font-medium">Options</h4>
								<p className="text-sm text-muted-foreground">
									MCQ uses four options. True/False is fixed to True and False.
								</p>
							</div>

							<div className="grid gap-3">
								{optionValues.map((option, index) => (
									<div key={index} className="grid gap-2 md:grid-cols-[1fr_180px] md:items-end">
										<FormField
											control={form.control}
											name={`options.${index}` as const}
											render={({ field }) => (
												<FormItem>
													<FormLabel>Option {index + 1}</FormLabel>
													<FormControl>
														<Input
															placeholder={questionType === QuestionType.TrueFalse ? 'True' : `Option ${index + 1}`}
															{...field}
															disabled={questionType === QuestionType.TrueFalse}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								))}
							</div>
						</div>

						<FormField
							control={form.control}
							name="correctAnswer"
							render={({ field }) => {
								const answerOptions = optionValues.filter((item) => item.trim().length > 0);

								return (
									<FormItem>
										<FormLabel>Correct Answer</FormLabel>
										<Select onValueChange={field.onChange} value={field.value} disabled={answerOptions.length === 0}>
											<FormControl>
														<SelectTrigger data-testid="question-correct-answer-trigger">
													<SelectValue placeholder="Choose the correct answer" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{answerOptions.map((option) => (
															<SelectItem key={option} value={option} data-testid={`question-correct-answer-${option.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`}>
														{option}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								);
							}}
						/>

						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
								Cancel
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Question'}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
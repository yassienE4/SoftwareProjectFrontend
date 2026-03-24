'use client';

import { useState } from 'react';
import { deleteExam, Exam } from '@/lib/api';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

interface DeleteExamDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	exam: Exam;
	onDeleted: () => void;
}

export default function DeleteExamDialog({
	open,
	onOpenChange,
	exam,
	onDeleted,
}: DeleteExamDialogProps) {
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		try {
			setIsDeleting(true);
			await deleteExam(exam.id);
			toast.success('Exam deleted successfully');
			onDeleted();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to delete exam');
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[460px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-destructive">
						<AlertTriangle className="h-5 w-5" />
						Delete Exam
					</DialogTitle>
					<DialogDescription className="pt-3">
						Are you sure you want to permanently delete this exam?
					</DialogDescription>
				</DialogHeader>

				<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 space-y-2">
					<div className="flex flex-col gap-1">
						<span className="text-sm font-medium">Title:</span>
						<span className="text-sm text-muted-foreground">{exam.title}</span>
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-sm font-medium">Status:</span>
						<span className="text-sm text-muted-foreground">{exam.status}</span>
					</div>
				</div>

				<div className="bg-muted p-3 rounded-md">
					<p className="text-sm text-muted-foreground">
						<strong className="text-foreground">Warning:</strong> This action cannot be undone.
						The exam, its questions, and any attempts will be removed from the system.
					</p>
				</div>

				<DialogFooter>
					<Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
						Cancel
					</Button>
					<Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
						{isDeleting ? 'Deleting...' : 'Delete Exam'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
'use client';

import { useState } from 'react';
import { User, deleteUser } from '@/lib/api';
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

interface DeleteUserDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	user: User;
	onUserDeleted: () => void;
}

export default function DeleteUserDialog({
	open,
	onOpenChange,
	user,
	onUserDeleted,
}: DeleteUserDialogProps) {
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		try {
			setIsDeleting(true);
			await deleteUser(user.id);
			toast.success('User deleted successfully');
			onUserDeleted();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to delete user');
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-destructive">
						<AlertTriangle className="h-5 w-5" />
						Delete User
					</DialogTitle>
					<DialogDescription className="pt-3">
						Are you sure you want to permanently delete this user?
					</DialogDescription>
				</DialogHeader>

				<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 space-y-2">
					<div className="flex flex-col gap-1">
						<span className="text-sm font-medium">Name:</span>
						<span className="text-sm text-muted-foreground">{user.name}</span>
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-sm font-medium">Email:</span>
						<span className="text-sm text-muted-foreground">{user.email}</span>
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-sm font-medium">Role:</span>
						<span className="text-sm text-muted-foreground">{user.role}</span>
					</div>
				</div>

				<div className="bg-muted p-3 rounded-md">
					<p className="text-sm text-muted-foreground">
						<strong className="text-foreground">Warning:</strong> This action cannot be undone. 
						The user and all associated data will be permanently removed from the system.
					</p>
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isDeleting}
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant="destructive"
						onClick={handleDelete}
						disabled={isDeleting}
					>
						{isDeleting ? 'Deleting...' : 'Delete User'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

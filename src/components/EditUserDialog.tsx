'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, updateUser, UserRole } from '@/lib/api';
import { updateUserSchema, UpdateUserFormData } from '@/lib/validations';
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
	FormDescription,
} from '@/components/ui/form';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface EditUserDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	user: User;
	onUserUpdated: () => void;
}

export default function EditUserDialog({
	open,
	onOpenChange,
	user,
	onUserUpdated,
}: EditUserDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm<UpdateUserFormData>({
		resolver: zodResolver(updateUserSchema),
		defaultValues: {
			name: user.name,
			email: user.email,
			role: user.role,
			password: '',
		},
	});

	// Reset form when user changes
	useEffect(() => {
		form.reset({
			name: user.name,
			email: user.email,
			role: user.role,
			password: '',
		});
	}, [user, form]);

	const onSubmit = async (data: UpdateUserFormData) => {
		try {
			setIsSubmitting(true);
			
			// Only send fields that have values
			const updateData: UpdateUserFormData = {};
			if (data.name && data.name !== user.name) {
				updateData.name = data.name;
			}
			if (data.email && data.email !== user.email) {
				updateData.email = data.email;
			}
			if (data.role && data.role !== user.role) {
				updateData.role = data.role;
			}
			if (data.password) {
				updateData.password = data.password;
			}

			// Check if there's anything to update
			if (Object.keys(updateData).length === 0) {
				toast.info('No changes to update');
				return;
			}

			await updateUser(user.id, updateData);
			toast.success('User updated successfully');
			onUserUpdated();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to update user');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleOpenChange = (open: boolean) => {
		if (!open && !isSubmitting) {
			form.reset({
				name: user.name,
				email: user.email,
				role: user.role,
				password: '',
			});
		}
		onOpenChange(open);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Edit User</DialogTitle>
					<DialogDescription>
						Update user information. Leave password blank to keep current password.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input placeholder="John Doe" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input
											type="email"
											placeholder="john@example.com"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="role"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Role</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
										value={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select a role" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value={UserRole.Student}>Student</SelectItem>
											<SelectItem value={UserRole.Instructor}>
												Instructor
											</SelectItem>
											<SelectItem value={UserRole.Admin}>Admin</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>New Password (Optional)</FormLabel>
									<FormControl>
										<Input
											type="password"
											placeholder="Leave blank to keep current"
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Enter a new password to reset it (min 6 characters)
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => handleOpenChange(false)}
								disabled={isSubmitting}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? 'Updating...' : 'Update User'}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

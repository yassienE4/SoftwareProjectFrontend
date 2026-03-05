'use client';

import { useState, useEffect } from 'react';
import { User, UserRole, getUsers, deleteUser } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import CreateUserDialog from '@/components/CreateUserDialog';
import EditUserDialog from '@/components/EditUserDialog';
import DeleteUserDialog from '@/components/DeleteUserDialog';

export default function AdminUsersPage() {
	return (
		<ProtectedRoute requiredRole={UserRole.Admin}>
			<UsersPageContent />
		</ProtectedRoute>
	);
}

function UsersPageContent() {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState<User | null>(null);

	const fetchUsers = async (role?: UserRole) => {
		try {
			setLoading(true);
			const data = await getUsers(role);
			setUsers(data);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to fetch users');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchUsers(roleFilter === 'all' ? undefined : roleFilter);
	}, [roleFilter]);

	const handleRoleFilterChange = (value: string) => {
		setRoleFilter(value as UserRole | 'all');
	};

	const handleEdit = (user: User) => {
		setSelectedUser(user);
		setEditDialogOpen(true);
	};

	const handleDelete = (user: User) => {
		setSelectedUser(user);
		setDeleteDialogOpen(true);
	};

	const handleUserCreated = () => {
		setCreateDialogOpen(false);
		fetchUsers(roleFilter === 'all' ? undefined : roleFilter);
	};

	const handleUserUpdated = () => {
		setEditDialogOpen(false);
		setSelectedUser(null);
		fetchUsers(roleFilter === 'all' ? undefined : roleFilter);
	};

	const handleUserDeleted = () => {
		setDeleteDialogOpen(false);
		setSelectedUser(null);
		fetchUsers(roleFilter === 'all' ? undefined : roleFilter);
	};

	const getRoleBadgeVariant = (role: UserRole) => {
		switch (role) {
			case UserRole.Admin:
				return 'destructive';
			case UserRole.Instructor:
				return 'default';
			case UserRole.Student:
				return 'secondary';
			default:
				return 'outline';
		}
	};

	return (
		<div className="container mx-auto py-10 px-4">
			<div className="flex flex-col gap-6">
				{/* Header */}
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<div>
						<h1 className="text-3xl font-bold">User Management</h1>
						<p className="text-muted-foreground mt-1">
							Manage system users and their roles
						</p>
					</div>
					<Button onClick={() => setCreateDialogOpen(true)}>
						<Plus className="mr-2 h-4 w-4" />
						Create User
					</Button>
				</div>

				{/* Filters */}
				<div className="flex items-center gap-4">
					<label className="text-sm font-medium">Filter by role:</label>
					<Select value={roleFilter} onValueChange={handleRoleFilterChange}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="All roles" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All roles</SelectItem>
							<SelectItem value={UserRole.Admin}>Admin</SelectItem>
							<SelectItem value={UserRole.Instructor}>Instructor</SelectItem>
							<SelectItem value={UserRole.Student}>Student</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Table */}
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Role</TableHead>
								<TableHead>Created At</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								// Loading skeleton
								Array.from({ length: 5 }).map((_, i) => (
									<TableRow key={i}>
										<TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
										<TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
										<TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
										<TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
										<TableCell className="text-right">
											<Skeleton className="h-8 w-[100px] ml-auto" />
										</TableCell>
									</TableRow>
								))
							) : users.length === 0 ? (
								<TableRow>
									<TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
										No users found
									</TableCell>
								</TableRow>
							) : (
								users.map((user) => (
									<TableRow key={user.id}>
										<TableCell className="font-medium">{user.name}</TableCell>
										<TableCell>{user.email}</TableCell>
										<TableCell>
											<Badge variant={getRoleBadgeVariant(user.role)}>
												{user.role}
											</Badge>
										</TableCell>
										<TableCell>
											{new Date(user.createdAt).toLocaleDateString()}
										</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end gap-2">
												<Button
													variant="ghost"
													size="icon"
													onClick={() => handleEdit(user)}
												>
													<Pencil className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => handleDelete(user)}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</div>

			{/* Dialogs */}
			<CreateUserDialog
				open={createDialogOpen}
				onOpenChange={setCreateDialogOpen}
				onUserCreated={handleUserCreated}
			/>

			{selectedUser && (
				<>
					<EditUserDialog
						open={editDialogOpen}
						onOpenChange={setEditDialogOpen}
						user={selectedUser}
						onUserUpdated={handleUserUpdated}
					/>
					<DeleteUserDialog
						open={deleteDialogOpen}
						onOpenChange={setDeleteDialogOpen}
						user={selectedUser}
						onUserDeleted={handleUserDeleted}
					/>
				</>
			)}
		</div>
	);
}

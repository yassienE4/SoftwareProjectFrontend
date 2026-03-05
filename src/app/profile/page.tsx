'use client';

import { useState, useEffect } from 'react';
import { User, getUserById } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { UserCircle, Mail, Shield, Calendar } from 'lucide-react';

export default function ProfilePage() {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchUserProfile = async () => {
			try {
				// Get current user from localStorage
				const storedUser = localStorage.getItem('user');
				if (!storedUser) {
					toast.error('User not found. Please login again.');
					window.location.href = '/login';
					return;
				}

				const currentUser = JSON.parse(storedUser);
				const userData = await getUserById(currentUser.id);
				setUser(userData);
			} catch (error) {
				toast.error(error instanceof Error ? error.message : 'Failed to load profile');
			} finally {
				setLoading(false);
			}
		};

		fetchUserProfile();
	}, []);

	const getRoleBadgeVariant = (role: string) => {
		switch (role) {
			case 'Admin':
				return 'destructive';
			case 'Instructor':
				return 'default';
			case 'Student':
				return 'secondary';
			default:
				return 'outline';
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};

	if (loading) {
		return (
			<div className="container mx-auto py-10 px-4 max-w-2xl">
				<Card>
					<CardHeader>
						<Skeleton className="h-8 w-[200px]" />
						<Skeleton className="h-4 w-[300px] mt-2" />
					</CardHeader>
					<CardContent className="space-y-6">
						<Skeleton className="h-20 w-full" />
						<Skeleton className="h-20 w-full" />
						<Skeleton className="h-20 w-full" />
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!user) {
		return (
			<div className="container mx-auto py-10 px-4 max-w-2xl">
				<Card>
					<CardContent className="py-10 text-center">
						<p className="text-muted-foreground">Failed to load profile</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-10 px-4 max-w-2xl">
			<Card>
				<CardHeader>
					<CardTitle className="text-3xl">Profile</CardTitle>
					<CardDescription>View your account information</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Name */}
					<div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
						<UserCircle className="h-5 w-5 mt-0.5 text-muted-foreground" />
						<div className="flex-1">
							<p className="text-sm font-medium text-muted-foreground">Name</p>
							<p className="text-lg font-semibold mt-1">{user.name}</p>
						</div>
					</div>

					{/* Email */}
					<div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
						<Mail className="h-5 w-5 mt-0.5 text-muted-foreground" />
						<div className="flex-1">
							<p className="text-sm font-medium text-muted-foreground">Email</p>
							<p className="text-lg font-semibold mt-1">{user.email}</p>
						</div>
					</div>

					{/* Role */}
					<div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
						<Shield className="h-5 w-5 mt-0.5 text-muted-foreground" />
						<div className="flex-1">
							<p className="text-sm font-medium text-muted-foreground">Role</p>
							<div className="mt-2">
								<Badge variant={getRoleBadgeVariant(user.role)} className="text-sm">
									{user.role}
								</Badge>
							</div>
						</div>
					</div>

					{/* Account Created */}
					<div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
						<Calendar className="h-5 w-5 mt-0.5 text-muted-foreground" />
						<div className="flex-1">
							<p className="text-sm font-medium text-muted-foreground">
								Account Created
							</p>
							<p className="text-lg font-semibold mt-1">
								{formatDate(user.createdAt)}
							</p>
						</div>
					</div>

					{/* Last Updated */}
					<div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
						<Calendar className="h-5 w-5 mt-0.5 text-muted-foreground" />
						<div className="flex-1">
							<p className="text-sm font-medium text-muted-foreground">
								Last Updated
							</p>
							<p className="text-lg font-semibold mt-1">
								{formatDate(user.updatedAt)}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

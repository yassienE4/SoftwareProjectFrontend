'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { signup } from '@/lib/api';

interface SignUpFormProps {
  onSuccess?: () => void;
}

export default function SignUpForm({ onSuccess }: SignUpFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.email || !formData.name || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await signup({
        email: formData.email,
        name: formData.name,
        password: formData.password,
        role: formData.role,
      });

      if (response.success) {
        toast.success('Account created successfully! You can now login.');
        setFormData({
          email: '',
          name: '',
          password: '',
          confirmPassword: '',
          role: 'user',
        });
        onSuccess?.();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">Full Name</Label>
        <Input
          id="signup-name"
          type="text"
          name="name"
          placeholder="Enter your full name"
          value={formData.name}
          onChange={handleChange}
          disabled={loading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          name="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleChange}
          disabled={loading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          name="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          disabled={loading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-confirm-password">Confirm Password</Label>
        <Input
          id="signup-confirm-password"
          type="password"
          name="confirmPassword"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={handleChange}
          disabled={loading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-role">Role</Label>
        <select
          id="signup-role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          disabled={loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
        </select>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loading}
      >
        {loading ? 'Creating account...' : 'Sign Up'}
      </Button>
    </form>
  );
}

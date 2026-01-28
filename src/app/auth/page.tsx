'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoginForm from '@/components/auth/LoginForm';
import SignUpForm from '@/components/auth/SignUpForm';

export default function AuthPage() {
  const [defaultTab, setDefaultTab] = useState('login');

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <Tabs value={defaultTab} onValueChange={setDefaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
                <p className="text-sm text-gray-500 mt-2">Enter your credentials to login</p>
              </div>
              <LoginForm />
            </div>
          </TabsContent>

          <TabsContent value="signup">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
                <p className="text-sm text-gray-500 mt-2">Fill in your details to sign up</p>
              </div>
              <SignUpForm onSuccess={() => setDefaultTab('login')} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

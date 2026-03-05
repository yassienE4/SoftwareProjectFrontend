'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, X } from 'lucide-react';
import { logout } from '@/lib/api';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function Navbar() {
  const [user, setUser] = useState<UserData | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    window.location.href = '/';
  };

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">S</span>
            </div>
            <span className="font-bold text-lg hidden sm:inline">SoftwareProject</span>
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2">
            <Link href="/" className="text-gray-700 hover:text-blue-600 transition">
              Home
            </Link>
            {user && (
              <>
                {user.role === 'Admin' && (
                  <Link href="/admin/users" className="text-gray-700 hover:text-blue-600 transition">
                    Dashboard
                  </Link>
                )}
                <Link href="/profile" className="text-gray-700 hover:text-blue-600 transition">
                  Profile
                </Link>
              </>
            )}
          </div>

          {/* Auth Buttons / User Menu - Fixed right */}
          <div className="flex-shrink-0 flex justify-end">
            <div className="flex items-center gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    {user.name || user.email}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {user.role === 'Admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin/users">Dashboard</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Sign Up</Link>
                </Button>
              </>
            )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 pt-2 pb-3 space-y-1">
            <Link href="/" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
              Home
            </Link>
            {user ? (
              <>
                {user.role === 'Admin' && (
                  <Link href="/admin/users" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                    Dashboard
                  </Link>
                )}
                <Link href="/profile" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                  Profile
                </Link>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50 w-full"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                  Login
                </Link>
                <Link href="/register" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

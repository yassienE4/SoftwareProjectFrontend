'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Shield, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-8">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900">
            Welcome to <span className="text-blue-600">SoftwareProject</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Build, manage, and collaborate on software projects with ease. 
            Get started in minutes with our powerful platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" asChild>
              <Link href="/auth" className="gap-2">
                Get Started <ArrowRight size={20} />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/#features">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-gray-200">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
          Powerful Features
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="text-blue-600" size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Lightning Fast</h3>
            <p className="text-gray-600">
              Experience blazing-fast performance with our optimized infrastructure.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="text-green-600" size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Secure</h3>
            <p className="text-gray-600">
              Enterprise-grade security to keep your projects and data safe.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="text-purple-600" size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Collaborative</h3>
            <p className="text-gray-600">
              Work together seamlessly with your team in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-gray-200">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">About Us</h2>
            <p className="text-lg text-gray-600 mb-4">
              SoftwareProject is built by developers, for developers. We understand 
              the challenges of managing complex projects and have created a platform 
              that makes collaboration effortless.
            </p>
            <p className="text-lg text-gray-600">
              Our mission is to empower teams to build great software faster and with 
              better quality. Join thousands of developers already using SoftwareProject.
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg h-80 flex items-center justify-center">
            <div className="text-center text-white">
              <h3 className="text-4xl font-bold mb-4">500+</h3>
              <p className="text-xl">Teams Trust Us</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-gray-200">
        <div className="bg-blue-600 rounded-lg p-12 text-center text-white space-y-6">
          <h2 className="text-4xl font-bold">Ready to get started?</h2>
          <p className="text-xl text-blue-100">
            Join the community of developers building amazing projects.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/auth">Create Your Account Now</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-gray-600">
            <p>&copy; 2026 SoftwareProject. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

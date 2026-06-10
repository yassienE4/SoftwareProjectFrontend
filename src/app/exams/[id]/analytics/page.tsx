'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getExamAnalytics, ExamAnalytics } from '@/lib/api';
import { toast } from 'sonner';

export default function AnalyticsPage() {
  return (
    <ProtectedRoute requiredRole="Instructor">
      <AnalyticsContent />
    </ProtectedRoute>
  );
}

function AnalyticsContent() {
  const params = useParams();
  const examId = Number(params.id);

  const [analytics, setAnalytics] = useState<ExamAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const data = await getExamAnalytics(examId);
        setAnalytics(data);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to load analytics'
        );
      } finally {
        setLoading(false);
      }
    };

    if (!Number.isNaN(examId)) {
      loadAnalytics();
    }
  }, [examId]);

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto py-10">
        <p>No analytics available.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">
        Exam Analytics
      </h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

        <Card>
          <CardHeader>
            <CardTitle>Total Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {analytics.totalAttempts}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {analytics.averageScore}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Highest Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {analytics.highestScore}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lowest Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {analytics.lowestScore}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pass Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {analytics.passRate}%
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, PlayCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface TestCycle {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  testPlan: { id: string; name: string; status: string };
  _count?: { testRuns: number };
}

export default function TestCyclesPage() {
  const [testCycles, setTestCycles] = useState<TestCycle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestCycles();
  }, []);

  const fetchTestCycles = async () => {
    try {
      const response = await fetch('/api/test-cycles');
      const data = await response.json();
      setTestCycles(data.testCycles || []);
    } catch (error) {
      console.error('Error fetching test cycles:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'default';
      case 'COMPLETED':
        return 'secondary';
      case 'NOT_STARTED':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Test Cycles</h1>
        <p className="text-gray-600 mt-2">View and manage test cycles</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">Loading...</div>
      ) : (
        <div className="grid gap-4">
          {testCycles.map((cycle) => (
            <Card key={cycle.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link href={`/test-cycles/${cycle.id}`}>
                      <CardTitle className="text-lg hover:underline cursor-pointer flex items-center gap-2">
                        <PlayCircle className="h-5 w-5" />
                        {cycle.name}
                      </CardTitle>
                    </Link>
                    {cycle.description && (
                      <p className="text-sm text-gray-600 mt-2">
                        {cycle.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <Link
                        href={`/test-plans/${cycle.testPlan.id}`}
                        className="hover:underline"
                      >
                        Plan: {cycle.testPlan.name}
                      </Link>
                      {cycle.startDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(cycle.startDate)}</span>
                          {cycle.endDate && (
                            <span> - {formatDate(cycle.endDate)}</span>
                          )}
                        </div>
                      )}
                      {cycle._count && (
                        <span>{cycle._count.testRuns} test runs</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Badge variant={getStatusBadgeVariant(cycle.status)}>
                  {cycle.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

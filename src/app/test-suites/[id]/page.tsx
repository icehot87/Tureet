'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, FileText } from 'lucide-react';
import Link from 'next/link';

interface TestSuite {
  id: string;
  name: string;
  description?: string;
  suiteCases: Array<{
    id: string;
    order: number;
    testCase: {
      id: string;
      title: string;
      status: string;
      priority: string;
      type: string;
      creator: { name?: string; email: string };
    };
  }>;
}

interface TestCase {
  id: string;
  title: string;
  status: string;
  priority: string;
  type: string;
}

export default function TestSuiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [suite, setSuite] = useState<TestSuite | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableTestCases, setAvailableTestCases] = useState<TestCase[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTestCaseId, setSelectedTestCaseId] = useState('');

  useEffect(() => {
    if (id) {
      fetchSuite();
      fetchAvailableTestCases();
    }
  }, [id]);

  const fetchSuite = async () => {
    try {
      const response = await fetch(`/api/test-suites/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSuite(data);
      } else {
        console.error('Failed to fetch test suite');
      }
    } catch (error) {
      console.error('Error fetching test suite:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTestCases = async () => {
    try {
      const response = await fetch('/api/test-cases?limit=1000');
      if (response.ok) {
        const data = await response.json();
        setAvailableTestCases(data.testCases || []);
      }
    } catch (error) {
      console.error('Error fetching test cases:', error);
    }
  };

  const handleAddTestCase = async () => {
    if (!selectedTestCaseId) return;

    try {
      const response = await fetch(`/api/test-suites/${id}/test-cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testCaseId: selectedTestCaseId }),
      });

      if (response.ok) {
        setIsAddDialogOpen(false);
        setSelectedTestCaseId('');
        fetchSuite();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add test case');
      }
    } catch (error) {
      console.error('Error adding test case:', error);
      alert('Failed to add test case');
    }
  };

  const handleRemoveTestCase = async (testCaseId: string) => {
    if (!confirm('Remove this test case from the suite?')) return;

    try {
      const response = await fetch(
        `/api/test-suites/${id}/test-cases?testCaseId=${testCaseId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        fetchSuite();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to remove test case');
      }
    } catch (error) {
      console.error('Error removing test case:', error);
      alert('Failed to remove test case');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!suite) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Test suite not found</p>
        <Button onClick={() => router.push('/test-suites')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Test Suites
        </Button>
      </div>
    );
  }

  const suiteTestCaseIds = new Set(suite.suiteCases.map(sc => sc.testCase.id));
  const availableToAdd = availableTestCases.filter(tc => !suiteTestCaseIds.has(tc.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/test-suites')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{suite.name}</h1>
            {suite.description && (
              <p className="text-gray-600 mt-2">{suite.description}</p>
            )}
          </div>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Test Case
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Cases ({suite.suiteCases.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {suite.suiteCases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No test cases in this suite</p>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Test Case
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {suite.suiteCases.map((suiteCase) => {
                const tc = suiteCase.testCase;
                return (
                  <div
                    key={suiteCase.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <Link
                        href={`/test-cases/${tc.id}`}
                        className="font-medium hover:underline"
                      >
                        {tc.title}
                      </Link>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{tc.status}</Badge>
                        <Badge variant="outline">{tc.priority}</Badge>
                        <Badge variant="outline">{tc.type}</Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTestCase(tc.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Test Case to Suite</DialogTitle>
            <DialogDescription>
              Select a test case to add to this suite
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="testCase">Test Case</Label>
              <Select value={selectedTestCaseId} onValueChange={setSelectedTestCaseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a test case" />
                </SelectTrigger>
                <SelectContent>
                  {availableToAdd.map((tc) => (
                    <SelectItem key={tc.id} value={tc.id}>
                      {tc.title} ({tc.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableToAdd.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  All test cases are already in this suite
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddTestCase}
              disabled={!selectedTestCaseId}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

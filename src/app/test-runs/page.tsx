'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, XCircle, AlertCircle, SkipForward, Circle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { canExecuteTests } from '@/lib/permissions';
import { formatDateTime } from '@/lib/utils';

interface TestRun {
  id: string;
  status: string;
  actualResult?: string;
  notes?: string;
  bugUrl?: string;
  executedAt?: string;
  testCase: {
    id: string;
    title: string;
    status: string;
    priority: string;
  };
  testCycle: { id: string; name: string };
  executor?: { id: string; name?: string; email: string };
}

export default function TestRunsPage() {
  const { data: session } = useSession();
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    status: 'NOT_STARTED',
    actualResult: '',
    notes: '',
    bugUrl: '',
  });

  useEffect(() => {
    fetchTestRuns();
  }, [statusFilter]);

  const fetchTestRuns = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/test-runs?${params}`);
      const data = await response.json();
      setTestRuns(data.testRuns || []);
    } catch (error) {
      console.error('Error fetching test runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = (run: TestRun) => {
    setSelectedRun(run);
    setFormData({
      status: run.status,
      actualResult: run.actualResult || '',
      notes: run.notes || '',
      bugUrl: run.bugUrl || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRun) return;

    try {
      const response = await fetch(`/api/test-runs/${selectedRun.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        setSelectedRun(null);
        fetchTestRuns();
      }
    } catch (error) {
      console.error('Error updating test run:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASSED':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'BLOCKED':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'SKIPPED':
        return <SkipForward className="h-5 w-5 text-gray-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PASSED':
        return 'default';
      case 'FAILED':
        return 'destructive';
      case 'BLOCKED':
        return 'secondary';
      case 'SKIPPED':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Test Runs</h1>
          <p className="text-gray-600 mt-2">Execute and track test results</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="NOT_STARTED">Not Started</SelectItem>
            <SelectItem value="PASSED">Passed</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="BLOCKED">Blocked</SelectItem>
            <SelectItem value="SKIPPED">Skipped</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">Loading...</div>
      ) : (
        <div className="grid gap-4">
          {testRuns.map((run) => (
            <Card key={run.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getStatusIcon(run.status)}
                      {run.testCase.title}
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span>Cycle: {run.testCycle.name}</span>
                      <Badge variant="outline">{run.testCase.priority}</Badge>
                      {run.executedAt && (
                        <span>
                          Executed: {formatDateTime(run.executedAt)} by{' '}
                          {run.executor?.name || run.executor?.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(run.status)}>
                      {run.status}
                    </Badge>
                    {canExecuteTests(session?.user?.role) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExecute(run)}
                      >
                        Execute
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {run.notes && (
                  <p className="text-sm text-gray-600 mt-2">{run.notes}</p>
                )}
                {run.bugUrl && (
                  <a
                    href={run.bugUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline mt-2 block"
                  >
                    View Bug
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Execute Test Run</DialogTitle>
            <DialogDescription>
              Record the test execution result
            </DialogDescription>
          </DialogHeader>
          {selectedRun && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                    <SelectItem value="PASSED">Passed</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                    <SelectItem value="BLOCKED">Blocked</SelectItem>
                    <SelectItem value="SKIPPED">Skipped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="actualResult">Actual Result</Label>
                <Textarea
                  id="actualResult"
                  value={formData.actualResult}
                  onChange={(e) =>
                    setFormData({ ...formData, actualResult: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="bugUrl">Bug URL</Label>
                <Input
                  id="bugUrl"
                  type="url"
                  value={formData.bugUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, bugUrl: e.target.value })
                  }
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Result</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

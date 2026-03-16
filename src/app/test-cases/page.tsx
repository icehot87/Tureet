'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { canEdit, canDelete } from '@/lib/permissions';
import { TestStepsEditor, TestStep } from '@/components/test-steps-editor';

interface TestCase {
  id: string;
  title: string;
  description?: string;
  steps?: string; // JSON string
  status: string;
  priority: string;
  type: string;
  tags: string[];
  folder?: { id: string; name: string };
  creator: { id: string; name?: string; email: string };
  createdAt: string;
}

export default function TestCasesPage() {
  const { data: session } = useSession();
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<TestCase | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    preconditions: '',
    steps: [] as TestStep[],
    expectedResults: '',
    status: 'DRAFT',
    priority: 'MEDIUM',
    type: 'FUNCTIONAL',
    tags: '',
    folderId: '',
  });

  useEffect(() => {
    fetchTestCases();
  }, [statusFilter, priorityFilter, search]);

  const fetchTestCases = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (search) params.append('search', search);
      params.append('limit', '100');

      const response = await fetch(`/api/test-cases?${params}`);
      const data = await response.json();
      setTestCases(data.testCases || []);
    } catch (error) {
      console.error('Error fetching test cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tagsArray = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      // Convert steps array to JSON format expected by API
      const stepsJson = JSON.stringify(
        formData.steps.map((step, index) => ({
          step: index + 1,
          action: step.action || '',
          expected: step.expected || '',
        }))
      );

      const payload = {
        title: formData.title,
        description: formData.description,
        preconditions: formData.preconditions,
        steps: stepsJson,
        expectedResults: formData.expectedResults,
        status: formData.status,
        priority: formData.priority,
        type: formData.type,
        tags: tagsArray,
        folderId: formData.folderId || undefined,
      };

      const url = editingCase
        ? `/api/test-cases/${editingCase.id}`
        : '/api/test-cases';
      const method = editingCase ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        resetForm();
        fetchTestCases();
      }
    } catch (error) {
      console.error('Error saving test case:', error);
    }
  };

  const handleEdit = (testCase: TestCase) => {
    setEditingCase(testCase);
    let stepsArray: TestStep[] = [];
    
    if (testCase.steps) {
      try {
        const parsed = JSON.parse(testCase.steps);
        if (Array.isArray(parsed)) {
          // Handle new format: [{step: number, action: string, expected: string}]
          stepsArray = parsed.map((s: any, index: number) => ({
            id: `step-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 11)}`,
            action: s.action || s || '',
            expected: s.expected || '',
          }));
        } else if (typeof parsed === 'string') {
          // Handle old string format (backward compatibility)
          const lines = parsed.split('\n').filter((line: string) => line.trim());
          stepsArray = lines.map((line: string, index: number) => ({
            id: `step-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 11)}`,
            action: line.trim(),
            expected: '',
          }));
        }
      } catch (e) {
        // If parsing fails, try to treat as plain string (backward compatibility)
        if (typeof testCase.steps === 'string') {
          const lines = testCase.steps.split('\n').filter((line) => line.trim());
          stepsArray = lines.map((line, index) => ({
            id: `step-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 11)}`,
            action: line.trim(),
            expected: '',
          }));
        }
      }
    }
    
    setFormData({
      title: testCase.title,
      description: testCase.description || '',
      preconditions: '',
      steps: stepsArray,
      expectedResults: '',
      status: testCase.status,
      priority: testCase.priority,
      type: testCase.type,
      tags: (testCase.tags || []).join(', '),
      folderId: testCase.folder?.id || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this test case?')) return;

    try {
      const response = await fetch(`/api/test-cases/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTestCases();
      }
    } catch (error) {
      console.error('Error deleting test case:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      preconditions: '',
      steps: [],
      expectedResults: '',
      status: 'DRAFT',
      priority: 'MEDIUM',
      type: 'FUNCTIONAL',
      tags: '',
      folderId: '',
    });
    setEditingCase(null);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'DRAFT':
        return 'secondary';
      case 'OBSOLETE':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'text-red-600';
      case 'HIGH':
        return 'text-orange-600';
      case 'MEDIUM':
        return 'text-yellow-600';
      case 'LOW':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Test Cases</h1>
          <p className="text-gray-600 mt-2">Manage your test cases</p>
        </div>
        {canEdit(session?.user?.role) && (
          <Button onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            New Test Case
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search test cases..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="OBSOLETE">Obsolete</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-64">Loading...</div>
      ) : (
        <div className="grid gap-4">
          {testCases.map((testCase) => (
            <Card key={testCase.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{testCase.title}</CardTitle>
                    {testCase.description && (
                      <p className="text-sm text-gray-600 mt-2">
                        {testCase.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {canEdit(session?.user?.role) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(testCase)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete(session?.user?.role) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(testCase.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 flex-wrap">
                  <Badge variant={getStatusBadgeVariant(testCase.status)}>
                    {testCase.status}
                  </Badge>
                  <span className={`text-sm font-medium ${getPriorityColor(testCase.priority)}`}>
                    {testCase.priority}
                  </span>
                  <span className="text-sm text-gray-600">{testCase.type}</span>
                  {testCase.folder && (
                    <span className="text-sm text-gray-600">
                      Folder: {testCase.folder.name}
                    </span>
                  )}
                  {(testCase.tags?.length || 0) > 0 && (
                    <div className="flex gap-2">
                      {(testCase.tags || []).map((tag, idx) => (
                        <Badge key={idx} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCase ? 'Edit Test Case' : 'New Test Case'}
            </DialogTitle>
            <DialogDescription>
              {editingCase
                ? 'Update the test case details'
                : 'Create a new test case'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
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
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="OBSOLETE">Obsolete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FUNCTIONAL">Functional</SelectItem>
                  <SelectItem value="REGRESSION">Regression</SelectItem>
                  <SelectItem value="INTEGRATION">Integration</SelectItem>
                  <SelectItem value="SMOKE">Smoke</SelectItem>
                  <SelectItem value="SECURITY">Security</SelectItem>
                  <SelectItem value="PERFORMANCE">Performance</SelectItem>
                  <SelectItem value="USABILITY">Usability</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <TestStepsEditor
                steps={formData.steps}
                onChange={(steps) => setFormData({ ...formData, steps })}
              />
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                placeholder="tag1, tag2, tag3"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Edit, Trash2, FileText } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { canEdit, canDelete } from '@/lib/permissions';

interface TestSuite {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  testCaseCount?: number;
}

export default function TestSuitesPage() {
  const { data: session } = useSession();
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSuite, setEditingSuite] = useState<TestSuite | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchTestSuites();
  }, [search]);

  const fetchTestSuites = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '100');

      const response = await fetch(`/api/test-suites?${params}`);
      const data = await response.json();
      setTestSuites(data.testSuites || []);
    } catch (error) {
      console.error('Error fetching test suites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingSuite
        ? `/api/test-suites/${editingSuite.id}`
        : '/api/test-suites';
      const method = editingSuite ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        resetForm();
        fetchTestSuites();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save test suite');
      }
    } catch (error) {
      console.error('Error saving test suite:', error);
      alert('Failed to save test suite');
    }
  };

  const handleEdit = (suite: TestSuite) => {
    setEditingSuite(suite);
    setFormData({
      name: suite.name,
      description: suite.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this test suite?')) {
      return;
    }

    try {
      const response = await fetch(`/api/test-suites/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTestSuites();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete test suite');
      }
    } catch (error) {
      console.error('Error deleting test suite:', error);
      alert('Failed to delete test suite');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingSuite(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const userCanEdit = session?.user && canEdit(session.user.role);
  const userCanDelete = session?.user && canDelete(session.user.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Test Suites</h1>
          <p className="text-gray-600 mt-2">
            Organize test cases into logical groups
          </p>
        </div>
        {userCanEdit && (
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Test Suite
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search test suites..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {testSuites.map((suite) => (
          <Card key={suite.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">
                  <Link
                    href={`/test-suites/${suite.id}`}
                    className="hover:underline"
                  >
                    {suite.name}
                  </Link>
                </CardTitle>
                <div className="flex gap-2">
                  {userCanEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(suite)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {userCanDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(suite.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {suite.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {suite.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <FileText className="h-4 w-4" />
                <span>{suite.testCaseCount || 0} test cases</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {testSuites.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No test suites found</p>
          {userCanEdit && (
            <Button onClick={() => setIsDialogOpen(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Create Test Suite
            </Button>
          )}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSuite ? 'Edit Test Suite' : 'Create Test Suite'}
            </DialogTitle>
            <DialogDescription>
              {editingSuite
                ? 'Update the test suite details'
                : 'Create a new test suite to organize test cases'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
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
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleDialogClose}>
                Cancel
              </Button>
              <Button type="submit">
                {editingSuite ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';

interface CustomField {
  id: string;
  name: string;
  description?: string;
  type: string;
  entityType: string;
  isRequired: boolean;
  defaultValue?: string;
  options: string[];
  order: number;
}

export default function CustomFieldsPage() {
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'TEXT',
    entityType: 'TEST_CASE',
    isRequired: false,
    defaultValue: '',
    options: '',
    order: 0,
  });

  useEffect(() => {
    fetchCustomFields();
  }, [entityTypeFilter]);

  const fetchCustomFields = async () => {
    try {
      const params = new URLSearchParams();
      if (entityTypeFilter !== 'all') {
        params.append('entityType', entityTypeFilter);
      }
      const response = await fetch(`/api/custom-fields?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCustomFields(data.customFields || []);
      }
    } catch (error) {
      console.error('Error fetching custom fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingField
        ? `/api/custom-fields/${editingField.id}`
        : '/api/custom-fields';
      const method = editingField ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        options: formData.options
          ? formData.options.split(',').map((o) => o.trim())
          : [],
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        resetForm();
        fetchCustomFields();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save custom field');
      }
    } catch (error) {
      console.error('Error saving custom field:', error);
      alert('Failed to save custom field');
    }
  };

  const handleEdit = (field: CustomField) => {
    setEditingField(field);
    setFormData({
      name: field.name,
      description: field.description || '',
      type: field.type,
      entityType: field.entityType,
      isRequired: field.isRequired,
      defaultValue: field.defaultValue || '',
      options: field.options.join(', '),
      order: field.order,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this custom field? This will also delete all its values.')) {
      return;
    }

    try {
      const response = await fetch(`/api/custom-fields/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCustomFields();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete custom field');
      }
    } catch (error) {
      console.error('Error deleting custom field:', error);
      alert('Failed to delete custom field');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'TEXT',
      entityType: 'TEST_CASE',
      isRequired: false,
      defaultValue: '',
      options: '',
      order: 0,
    });
    setEditingField(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Custom Fields</h1>
          <p className="text-gray-600 mt-2">
            Define custom fields for test cases, runs, plans, and cycles
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Custom Field
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by entity type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="TEST_CASE">Test Cases</SelectItem>
            <SelectItem value="TEST_RUN">Test Runs</SelectItem>
            <SelectItem value="TEST_PLAN">Test Plans</SelectItem>
            <SelectItem value="TEST_CYCLE">Test Cycles</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {customFields.map((field) => (
          <Card key={field.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{field.name}</CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{field.entityType.replace('_', ' ')}</Badge>
                    <Badge variant="outline">{field.type}</Badge>
                    {field.isRequired && <Badge>Required</Badge>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(field)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(field.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {field.description && (
                <p className="text-sm text-gray-600 mb-2">{field.description}</p>
              )}
              {field.options.length > 0 && (
                <p className="text-xs text-gray-500">
                  Options: {field.options.join(', ')}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {customFields.length === 0 && (
        <div className="text-center py-12">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No custom fields defined</p>
          <Button onClick={() => setIsDialogOpen(true)} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Create Custom Field
          </Button>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingField ? 'Edit Custom Field' : 'Create Custom Field'}
            </DialogTitle>
            <DialogDescription>
              Define a custom field that can be used on entities
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="entityType">Entity Type *</Label>
                  <Select
                    value={formData.entityType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, entityType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEST_CASE">Test Case</SelectItem>
                      <SelectItem value="TEST_RUN">Test Run</SelectItem>
                      <SelectItem value="TEST_PLAN">Test Plan</SelectItem>
                      <SelectItem value="TEST_CYCLE">Test Cycle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Field Type *</Label>
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
                      <SelectItem value="TEXT">Text</SelectItem>
                      <SelectItem value="NUMBER">Number</SelectItem>
                      <SelectItem value="DATE">Date</SelectItem>
                      <SelectItem value="DROPDOWN">Dropdown</SelectItem>
                      <SelectItem value="MULTI_SELECT">Multi-Select</SelectItem>
                      <SelectItem value="CHECKBOX">Checkbox</SelectItem>
                      <SelectItem value="URL">URL</SelectItem>
                      <SelectItem value="USER">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="order">Order</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        order: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              {(formData.type === 'DROPDOWN' ||
                formData.type === 'MULTI_SELECT') && (
                <div>
                  <Label htmlFor="options">
                    Options (comma-separated) *
                  </Label>
                  <Input
                    id="options"
                    value={formData.options}
                    onChange={(e) =>
                      setFormData({ ...formData, options: e.target.value })
                    }
                    placeholder="Option 1, Option 2, Option 3"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="defaultValue">Default Value</Label>
                <Input
                  id="defaultValue"
                  value={formData.defaultValue}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultValue: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRequired"
                  checked={formData.isRequired}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isRequired: checked === true })
                  }
                />
                <Label htmlFor="isRequired">Required field</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit">
                {editingField ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

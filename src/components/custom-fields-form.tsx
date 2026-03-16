'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface CustomField {
  id: string;
  name: string;
  description?: string;
  type: string;
  isRequired: boolean;
  defaultValue?: string;
  options: string[];
}

interface CustomFieldValue {
  id: string;
  customFieldId: string;
  value: string | null;
  customField: CustomField;
}

interface CustomFieldsFormProps {
  entityType: 'TEST_CASE' | 'TEST_RUN' | 'TEST_PLAN' | 'TEST_CYCLE';
  entityId: string;
  onChange?: (values: Record<string, string | null>) => void;
}

export function CustomFieldsForm({
  entityType,
  entityId,
  onChange,
}: CustomFieldsFormProps) {
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [values, setValues] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomFields();
    if (entityId) {
      fetchValues();
    }
  }, [entityType, entityId]);

  const fetchCustomFields = async () => {
    try {
      const response = await fetch(`/api/custom-fields?entityType=${entityType}`);
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

  const fetchValues = async () => {
    try {
      const response = await fetch(
        `/api/custom-field-values?entityType=${entityType}&entityId=${entityId}`
      );
      if (response.ok) {
        const data = await response.json();
        const valuesMap: Record<string, string | null> = {};
        data.values.forEach((v: CustomFieldValue) => {
          valuesMap[v.customFieldId] = v.value;
        });
        setValues(valuesMap);
        if (onChange) onChange(valuesMap);
      }
    } catch (error) {
      console.error('Error fetching custom field values:', error);
    }
  };

  const handleValueChange = async (
    fieldId: string,
    value: string | null
  ) => {
    const newValues = { ...values, [fieldId]: value };
    setValues(newValues);

    if (onChange) {
      onChange(newValues);
    }

    // Save to server if entityId exists
    if (entityId) {
      try {
        await fetch('/api/custom-field-values', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customFieldId: fieldId,
            entityType,
            entityId,
            value,
          }),
        });
      } catch (error) {
        console.error('Error saving custom field value:', error);
      }
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading custom fields...</div>;
  }

  if (customFields.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Custom Fields</h3>
      {customFields.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={`custom-${field.id}`}>
            {field.name}
            {field.isRequired && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {field.description && (
            <p className="text-xs text-gray-500">{field.description}</p>
          )}

          {field.type === 'TEXT' && (
            <Input
              id={`custom-${field.id}`}
              value={values[field.id] || field.defaultValue || ''}
              onChange={(e) => handleValueChange(field.id, e.target.value || null)}
              required={field.isRequired}
            />
          )}

          {field.type === 'NUMBER' && (
            <Input
              id={`custom-${field.id}`}
              type="number"
              value={values[field.id] || field.defaultValue || ''}
              onChange={(e) => handleValueChange(field.id, e.target.value || null)}
              required={field.isRequired}
            />
          )}

          {field.type === 'DATE' && (
            <Input
              id={`custom-${field.id}`}
              type="date"
              value={values[field.id] || field.defaultValue || ''}
              onChange={(e) => handleValueChange(field.id, e.target.value || null)}
              required={field.isRequired}
            />
          )}

          {field.type === 'DROPDOWN' && (
            <Select
              value={values[field.id] || field.defaultValue || ''}
              onValueChange={(value) => handleValueChange(field.id, value || null)}
            >
              <SelectTrigger id={`custom-${field.id}`}>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {field.type === 'MULTI_SELECT' && (
            <div className="space-y-2">
              {field.options.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`custom-${field.id}-${option}`}
                    checked={
                      values[field.id]
                        ?.split(',')
                        .map((v) => v.trim())
                        .includes(option) || false
                    }
                    onCheckedChange={(checked) => {
                      const currentValues = values[field.id]
                        ?.split(',')
                        .map((v) => v.trim()) || [];
                      const newValues = checked
                        ? [...currentValues, option]
                        : currentValues.filter((v) => v !== option);
                      handleValueChange(
                        field.id,
                        newValues.length > 0 ? newValues.join(', ') : null
                      );
                    }}
                  />
                  <Label htmlFor={`custom-${field.id}-${option}`}>
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          )}

          {field.type === 'CHECKBOX' && (
            <Checkbox
              id={`custom-${field.id}`}
              checked={values[field.id] === 'true'}
              onCheckedChange={(checked) =>
                handleValueChange(field.id, checked ? 'true' : null)
              }
            />
          )}

          {field.type === 'URL' && (
            <Input
              id={`custom-${field.id}`}
              type="url"
              value={values[field.id] || field.defaultValue || ''}
              onChange={(e) => handleValueChange(field.id, e.target.value || null)}
              required={field.isRequired}
            />
          )}

          {field.type === 'USER' && (
            <Input
              id={`custom-${field.id}`}
              value={values[field.id] || field.defaultValue || ''}
              onChange={(e) => handleValueChange(field.id, e.target.value || null)}
              placeholder="User email"
              required={field.isRequired}
            />
          )}
        </div>
      ))}
    </div>
  );
}

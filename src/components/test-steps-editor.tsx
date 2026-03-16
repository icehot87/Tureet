'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TestStep {
  id: string;
  action: string;
  expected: string;
}

interface TestStepsEditorProps {
  steps: TestStep[];
  onChange: (steps: TestStep[]) => void;
}

interface SortableStepItemProps {
  step: TestStep;
  index: number;
  onUpdate: (id: string, field: 'action' | 'expected', value: string) => void;
  onDelete: (id: string) => void;
}

function SortableStepItem({ step, index, onUpdate, onDelete }: SortableStepItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex gap-3 p-4 border rounded-lg bg-white',
        isDragging && 'shadow-lg border-primary'
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="flex items-center justify-center h-10 w-8 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        aria-label={`Drag to reorder step ${index + 1}`}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="flex items-center justify-center min-w-[3rem]">
        <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
          {index + 1}
        </span>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor={`step-${step.id}-action`} className="text-xs">
            Action
          </Label>
          <Input
            id={`step-${step.id}-action`}
            value={step.action}
            onChange={(e) => onUpdate(step.id, 'action', e.target.value)}
            placeholder="Enter step action..."
            className="w-full"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`step-${step.id}-expected`} className="text-xs">
            Expected Result
          </Label>
          <Input
            id={`step-${step.id}-expected`}
            value={step.expected}
            onChange={(e) => onUpdate(step.id, 'expected', e.target.value)}
            placeholder="Enter expected result..."
            className="w-full"
          />
        </div>
      </div>

      <div className="flex items-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onDelete(step.id)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          aria-label={`Delete step ${index + 1}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function TestStepsEditor({ steps, onChange }: TestStepsEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex((step) => step.id === active.id);
      const newIndex = steps.findIndex((step) => step.id === over.id);
      onChange(arrayMove(steps, oldIndex, newIndex));
    }
  };

  const handleAddStep = () => {
    const newStep: TestStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      action: '',
      expected: '',
    };
    onChange([...steps, newStep]);
  };

  const handleUpdateStep = (id: string, field: 'action' | 'expected', value: string) => {
    onChange(
      steps.map((step) => (step.id === id ? { ...step, [field]: value } : step))
    );
  };

  const handleDeleteStep = (id: string) => {
    onChange(steps.filter((step) => step.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Test Steps</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddStep}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Step
        </Button>
      </div>

      {steps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg text-center">
          <p className="text-sm text-gray-500 mb-4">No test steps added yet</p>
          <Button
            type="button"
            variant="outline"
            onClick={handleAddStep}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add First Step
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={steps.map((step) => step.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {steps.map((step, index) => (
                <SortableStepItem
                  key={step.id}
                  step={step}
                  index={index}
                  onUpdate={handleUpdateStep}
                  onDelete={handleDeleteStep}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { canEdit, canDelete } from '@/lib/permissions';

const customFieldUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isRequired: z.boolean().optional(),
  defaultValue: z.string().optional(),
  options: z.array(z.string()).optional(),
  order: z.number().optional(),
});

// GET /api/custom-fields/[id] - Get custom field
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customField = await prisma.customField.findUnique({
      where: { id: params.id },
    });

    if (!customField) {
      return NextResponse.json(
        { error: 'Custom field not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(customField);
  } catch (error) {
    console.error('Error fetching custom field:', error);
    return NextResponse.json(
      { error: 'Failed to fetch custom field' },
      { status: 500 }
    );
  }
}

// PUT /api/custom-fields/[id] - Update custom field
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canEdit(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = customFieldUpdateSchema.parse(body);

    const customField = await prisma.customField.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json(customField);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        { error: 'Custom field not found' },
        { status: 404 }
      );
    }
    console.error('Error updating custom field:', error);
    return NextResponse.json(
      { error: 'Failed to update custom field' },
      { status: 500 }
    );
  }
}

// DELETE /api/custom-fields/[id] - Delete custom field
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canDelete(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.customField.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'Custom field deleted successfully',
    });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        { error: 'Custom field not found' },
        { status: 404 }
      );
    }
    console.error('Error deleting custom field:', error);
    return NextResponse.json(
      { error: 'Failed to delete custom field' },
      { status: 500 }
    );
  }
}

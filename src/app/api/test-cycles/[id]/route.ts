import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { canEdit, canDelete } from '@/lib/permissions';

const testCycleUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']).optional(),
});

// GET /api/test-cycles/[id] - Get test cycle details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const testCycle = await prisma.testCycle.findUnique({
      where: { id: params.id },
      include: {
        testPlan: {
          select: { id: true, name: true, status: true },
        },
        testRuns: {
          include: {
            testCase: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
              },
            },
            executor: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!testCycle) {
      return NextResponse.json(
        { error: 'Test cycle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(testCycle);
  } catch (error) {
    console.error('Error fetching test cycle:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test cycle' },
      { status: 500 }
    );
  }
}

// PUT /api/test-cycles/[id] - Update test cycle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canEdit(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = testCycleUpdateSchema.parse(body);

    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.startDate !== undefined) {
      updateData.startDate = validatedData.startDate ? new Date(validatedData.startDate) : null;
    }
    if (validatedData.endDate !== undefined) {
      updateData.endDate = validatedData.endDate ? new Date(validatedData.endDate) : null;
    }
    if (validatedData.status !== undefined) updateData.status = validatedData.status;

    const testCycle = await prisma.testCycle.update({
      where: { id: params.id },
      data: updateData,
      include: {
        testPlan: {
          select: { id: true, name: true, status: true },
        },
      },
    });

    return NextResponse.json(testCycle);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating test cycle:', error);
    return NextResponse.json(
      { error: 'Failed to update test cycle' },
      { status: 500 }
    );
  }
}

// DELETE /api/test-cycles/[id] - Delete test cycle
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canDelete(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.testCycle.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Test cycle deleted successfully' });
  } catch (error) {
    console.error('Error deleting test cycle:', error);
    return NextResponse.json(
      { error: 'Failed to delete test cycle' },
      { status: 500 }
    );
  }
}

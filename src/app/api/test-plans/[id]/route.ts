import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { canEdit, canDelete } from '@/lib/permissions';

const testPlanUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
});

// GET /api/test-plans/[id] - Get test plan details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const testPlan = await prisma.testPlan.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        testCases: {
          orderBy: { order: 'asc' },
          include: {
            testCase: {
              include: {
                folder: true,
                creator: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        },
        testCycles: {
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { testRuns: true },
            },
          },
        },
      },
    });

    if (!testPlan) {
      return NextResponse.json(
        { error: 'Test plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(testPlan);
  } catch (error) {
    console.error('Error fetching test plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test plan' },
      { status: 500 }
    );
  }
}

// PUT /api/test-plans/[id] - Update test plan
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
    const validatedData = testPlanUpdateSchema.parse(body);

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

    const testPlan = await prisma.testPlan.update({
      where: { id: params.id },
      data: updateData,
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(testPlan);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating test plan:', error);
    return NextResponse.json(
      { error: 'Failed to update test plan' },
      { status: 500 }
    );
  }
}

// DELETE /api/test-plans/[id] - Delete test plan
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

    await prisma.testPlan.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Test plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting test plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete test plan' },
      { status: 500 }
    );
  }
}

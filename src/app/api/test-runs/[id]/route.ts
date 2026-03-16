import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { canExecuteTests } from '@/lib/permissions';

const testRunUpdateSchema = z.object({
  status: z.enum(['NOT_STARTED', 'PASSED', 'FAILED', 'BLOCKED', 'SKIPPED']).optional(),
  actualResult: z.string().optional(),
  notes: z.string().optional(),
  bugUrl: z.string().optional(),
});

// GET /api/test-runs/[id] - Get test run details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const testRun = await prisma.testRun.findUnique({
      where: { id: params.id },
      include: {
        testCase: {
          include: {
            folder: true,
            creator: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        testCycle: {
          include: {
            testPlan: {
              select: { id: true, name: true },
            },
          },
        },
        executor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!testRun) {
      return NextResponse.json(
        { error: 'Test run not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(testRun);
  } catch (error) {
    console.error('Error fetching test run:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test run' },
      { status: 500 }
    );
  }
}

// PUT /api/test-runs/[id] - Update test run
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canExecuteTests(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = testRunUpdateSchema.parse(body);

    const updateData: any = {};
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
      // If status is being set to executed state, update executor and execution time
      if (['PASSED', 'FAILED', 'BLOCKED', 'SKIPPED'].includes(validatedData.status)) {
        updateData.executedById = session.user.id;
        updateData.executedAt = new Date();
      }
    }
    if (validatedData.actualResult !== undefined) updateData.actualResult = validatedData.actualResult;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;
    if (validatedData.bugUrl !== undefined) updateData.bugUrl = validatedData.bugUrl;

    const testRun = await prisma.testRun.update({
      where: { id: params.id },
      data: updateData,
      include: {
        testCase: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
        testCycle: {
          select: { id: true, name: true },
        },
        executor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(testRun);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating test run:', error);
    return NextResponse.json(
      { error: 'Failed to update test run' },
      { status: 500 }
    );
  }
}

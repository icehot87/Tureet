import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { canExecuteTests } from '@/lib/permissions';

const testRunSchema = z.object({
  testCaseId: z.string(),
  testCycleId: z.string(),
  status: z.enum(['NOT_STARTED', 'PASSED', 'FAILED', 'BLOCKED', 'SKIPPED']).optional(),
  actualResult: z.string().optional(),
  notes: z.string().optional(),
  bugUrl: z.string().optional(),
});

// GET /api/test-runs - List test runs
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const testCycleId = searchParams.get('testCycleId');
    const testCaseId = searchParams.get('testCaseId');
    const status = searchParams.get('status');
    const executedById = searchParams.get('executedById');

    const where: any = {};
    if (testCycleId) where.testCycleId = testCycleId;
    if (testCaseId) where.testCaseId = testCaseId;
    if (status) where.status = status;
    if (executedById) where.executedById = executedById;

    const testRuns = await prisma.testRun.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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

    return NextResponse.json({ testRuns });
  } catch (error) {
    console.error('Error fetching test runs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test runs' },
      { status: 500 }
    );
  }
}

// POST /api/test-runs - Create new test run
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canExecuteTests(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = testRunSchema.parse(body);

    const testRun = await prisma.testRun.upsert({
      where: {
        testCaseId_testCycleId: {
          testCaseId: validatedData.testCaseId,
          testCycleId: validatedData.testCycleId,
        },
      },
      create: {
        testCaseId: validatedData.testCaseId,
        testCycleId: validatedData.testCycleId,
        status: validatedData.status || 'NOT_STARTED',
        actualResult: validatedData.actualResult,
        notes: validatedData.notes,
        bugUrl: validatedData.bugUrl,
      },
      update: {
        status: validatedData.status,
        actualResult: validatedData.actualResult,
        notes: validatedData.notes,
        bugUrl: validatedData.bugUrl,
      },
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

    return NextResponse.json(testRun, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating test run:', error);
    return NextResponse.json(
      { error: 'Failed to create test run' },
      { status: 500 }
    );
  }
}

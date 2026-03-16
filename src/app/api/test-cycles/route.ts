import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { canEdit } from '@/lib/permissions';

const testCycleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']).optional(),
  testPlanId: z.string(),
});

// GET /api/test-cycles - List test cycles
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const testPlanId = searchParams.get('testPlanId');
    const status = searchParams.get('status');

    const where: any = {};
    if (testPlanId) where.testPlanId = testPlanId;
    if (status) where.status = status;

    const testCycles = await prisma.testCycle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        testPlan: {
          select: { id: true, name: true, status: true },
        },
        _count: {
          select: { testRuns: true },
        },
      },
    });

    return NextResponse.json({ testCycles });
  } catch (error) {
    console.error('Error fetching test cycles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test cycles' },
      { status: 500 }
    );
  }
}

// POST /api/test-cycles - Create new test cycle
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canEdit(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = testCycleSchema.parse(body);

    const testCycle = await prisma.testCycle.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        status: validatedData.status || 'NOT_STARTED',
        testPlanId: validatedData.testPlanId,
      },
      include: {
        testPlan: {
          select: { id: true, name: true, status: true },
        },
      },
    });

    return NextResponse.json(testCycle, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating test cycle:', error);
    return NextResponse.json(
      { error: 'Failed to create test cycle' },
      { status: 500 }
    );
  }
}

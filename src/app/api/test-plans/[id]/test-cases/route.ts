import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { canEdit } from '@/lib/permissions';

const addTestCaseSchema = z.object({
  testCaseId: z.string(),
  order: z.number().optional(),
});

// GET /api/test-plans/[id]/test-cases - Get test cases in plan
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const testPlanCases = await prisma.testPlanCase.findMany({
      where: { testPlanId: params.id },
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
    });

    return NextResponse.json({ testCases: testPlanCases });
  } catch (error) {
    console.error('Error fetching test plan cases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test plan cases' },
      { status: 500 }
    );
  }
}

// POST /api/test-plans/[id]/test-cases - Add test case to plan
export async function POST(
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
    const validatedData = addTestCaseSchema.parse(body);

    // Get the max order for this plan
    const maxOrder = await prisma.testPlanCase.findFirst({
      where: { testPlanId: params.id },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const order = validatedData.order ?? (maxOrder ? maxOrder.order + 1 : 0);

    const testPlanCase = await prisma.testPlanCase.create({
      data: {
        testPlanId: params.id,
        testCaseId: validatedData.testCaseId,
        order,
      },
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
    });

    return NextResponse.json(testPlanCase, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error adding test case to plan:', error);
    return NextResponse.json(
      { error: 'Failed to add test case to plan' },
      { status: 500 }
    );
  }
}

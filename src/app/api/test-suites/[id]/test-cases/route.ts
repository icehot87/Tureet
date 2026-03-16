import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const addTestCaseSchema = z.object({
  testCaseId: z.string(),
  order: z.number().optional().default(0),
});

// GET /api/test-suites/[id]/test-cases - Get test cases in suite
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const suiteCases = await prisma.testSuiteCase.findMany({
      where: { suiteId: params.id },
      orderBy: { order: 'asc' },
      include: {
        testCase: {
          include: {
            creator: {
              select: { id: true, name: true, email: true },
            },
            folder: true,
          },
        },
      },
    });

    return NextResponse.json({ suiteCases });
  } catch (error) {
    console.error('Error fetching suite test cases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test cases' },
      { status: 500 }
    );
  }
}

// POST /api/test-suites/[id]/test-cases - Add test case to suite
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = addTestCaseSchema.parse(body);

    // Verify suite exists
    const suite = await prisma.testSuite.findUnique({
      where: { id: params.id },
    });

    if (!suite) {
      return NextResponse.json(
        { error: 'Test suite not found' },
        { status: 404 }
      );
    }

    // Verify test case exists
    const testCase = await prisma.testCase.findUnique({
      where: { id: validatedData.testCaseId },
    });

    if (!testCase) {
      return NextResponse.json(
        { error: 'Test case not found' },
        { status: 404 }
      );
    }

    const suiteCase = await prisma.testSuiteCase.create({
      data: {
        suiteId: params.id,
        testCaseId: validatedData.testCaseId,
        order: validatedData.order || 0,
      },
      include: {
        testCase: {
          include: {
            creator: {
              select: { id: true, name: true, email: true },
            },
            folder: true,
          },
        },
      },
    });

    return NextResponse.json(suiteCase, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    if ((error as any).code === 'P2002') {
      return NextResponse.json(
        { error: 'Test case already in suite' },
        { status: 409 }
      );
    }
    console.error('Error adding test case to suite:', error);
    return NextResponse.json(
      { error: 'Failed to add test case to suite' },
      { status: 500 }
    );
  }
}

// DELETE /api/test-suites/[id]/test-cases - Remove test case from suite
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const testCaseId = searchParams.get('testCaseId');

    if (!testCaseId) {
      return NextResponse.json(
        { error: 'testCaseId parameter is required' },
        { status: 400 }
      );
    }

    await prisma.testSuiteCase.delete({
      where: {
        suiteId_testCaseId: {
          suiteId: params.id,
          testCaseId: testCaseId,
        },
      },
    });

    return NextResponse.json({
      message: 'Test case removed from suite successfully',
    });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        { error: 'Test case not found in suite' },
        { status: 404 }
      );
    }
    console.error('Error removing test case from suite:', error);
    return NextResponse.json(
      { error: 'Failed to remove test case from suite' },
      { status: 500 }
    );
  }
}

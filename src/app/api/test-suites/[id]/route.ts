import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const testSuiteUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

// GET /api/test-suites/[id] - Get test suite by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const testSuite = await prisma.testSuite.findUnique({
      where: { id: params.id },
      include: {
        suiteCases: {
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
        },
      },
    });

    if (!testSuite) {
      return NextResponse.json(
        { error: 'Test suite not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(testSuite);
  } catch (error) {
    console.error('Error fetching test suite:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test suite' },
      { status: 500 }
    );
  }
}

// PUT /api/test-suites/[id] - Update test suite
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = testSuiteUpdateSchema.parse(body);

    const testSuite = await prisma.testSuite.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json(testSuite);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        { error: 'Test suite not found' },
        { status: 404 }
      );
    }
    console.error('Error updating test suite:', error);
    return NextResponse.json(
      { error: 'Failed to update test suite' },
      { status: 500 }
    );
  }
}

// DELETE /api/test-suites/[id] - Delete test suite
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.testSuite.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Test suite deleted successfully' });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        { error: 'Test suite not found' },
        { status: 404 }
      );
    }
    console.error('Error deleting test suite:', error);
    return NextResponse.json(
      { error: 'Failed to delete test suite' },
      { status: 500 }
    );
  }
}

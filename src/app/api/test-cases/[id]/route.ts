import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { canEdit, canDelete } from '@/lib/permissions';
import { createActivity } from '@/lib/activity';

const testCaseUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  preconditions: z.string().optional(),
  steps: z.string().optional(),
  expectedResults: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'OBSOLETE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  type: z.enum(['FUNCTIONAL', 'REGRESSION', 'INTEGRATION', 'SMOKE', 'SECURITY', 'PERFORMANCE', 'USABILITY']).optional(),
  tags: z.array(z.string()).optional(),
  folderId: z.string().nullable().optional(),
});

// GET /api/test-cases/[id] - Get test case details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const testCase = await prisma.testCase.findUnique({
      where: { id: params.id },
      include: {
        folder: true,
        creator: {
          select: { id: true, name: true, email: true },
        },
        testPlanCases: {
          include: {
            testPlan: {
              select: { id: true, name: true, status: true },
            },
          },
        },
        testRuns: {
          include: {
            testCycle: {
              select: { id: true, name: true },
            },
            executor: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!testCase) {
      return NextResponse.json(
        { error: 'Test case not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(testCase);
  } catch (error) {
    console.error('Error fetching test case:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test case' },
      { status: 500 }
    );
  }
}

// PUT /api/test-cases/[id] - Update test case
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
    const validatedData = testCaseUpdateSchema.parse(body);

    // Get current test case before updating
    const currentTestCase = await prisma.testCase.findUnique({
      where: { id: params.id },
    });

    if (!currentTestCase) {
      return NextResponse.json(
        { error: 'Test case not found' },
        { status: 404 }
      );
    }

    // Create version before updating
    const latestVersion = await prisma.testCaseVersion.findFirst({
      where: { testCaseId: params.id },
      orderBy: { version: 'desc' },
    });

    const nextVersion = (latestVersion?.version || 0) + 1;

    await prisma.testCaseVersion.create({
      data: {
        testCaseId: params.id,
        version: nextVersion,
        title: currentTestCase.title,
        description: currentTestCase.description,
        preconditions: currentTestCase.preconditions,
        steps: currentTestCase.steps,
        expectedResults: currentTestCase.expectedResults,
        status: currentTestCase.status,
        priority: currentTestCase.priority,
        type: currentTestCase.type,
        tags: currentTestCase.tags,
        requirementId: currentTestCase.requirementId,
        folderId: currentTestCase.folderId,
        createdById: currentTestCase.createdById,
      },
    });

    // Update test case
    const testCase = await prisma.testCase.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        folder: true,
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Log activity
    await createActivity({
      type: 'UPDATED',
      entityType: 'TEST_CASE',
      entityId: params.id,
      userId: session.user.id,
      details: { version: nextVersion },
    });

    return NextResponse.json(testCase);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating test case:', error);
    return NextResponse.json(
      { error: 'Failed to update test case' },
      { status: 500 }
    );
  }
}

// DELETE /api/test-cases/[id] - Delete test case
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

    await prisma.testCase.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Test case deleted successfully' });
  } catch (error) {
    console.error('Error deleting test case:', error);
    return NextResponse.json(
      { error: 'Failed to delete test case' },
      { status: 500 }
    );
  }
}

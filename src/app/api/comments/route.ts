import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createActivity } from '@/lib/activity';

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
  entityType: z.enum(['TEST_CASE', 'TEST_RUN', 'TEST_PLAN', 'TEST_CYCLE']),
  entityId: z.string(),
});

// GET /api/comments - List comments for an entity
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required' },
        { status: 400 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: {
        entityType: entityType as any,
        entityId,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST /api/comments - Create comment
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = commentSchema.parse(body);

    // Verify entity exists
    const entityExists = await verifyEntityExists(
      validatedData.entityType,
      validatedData.entityId
    );
    if (!entityExists) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        content: validatedData.content,
        entityType: validatedData.entityType as any,
        entityId: validatedData.entityId,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    // Create activity log entry
    await createActivity({
      type: 'COMMENTED',
      entityType: validatedData.entityType as any,
      entityId: validatedData.entityId,
      userId: session.user.id,
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

async function verifyEntityExists(
  entityType: string,
  entityId: string
): Promise<boolean> {
  try {
    switch (entityType) {
      case 'TEST_CASE':
        const testCase = await prisma.testCase.findUnique({
          where: { id: entityId },
        });
        return !!testCase;
      case 'TEST_RUN':
        const testRun = await prisma.testRun.findUnique({
          where: { id: entityId },
        });
        return !!testRun;
      case 'TEST_PLAN':
        const testPlan = await prisma.testPlan.findUnique({
          where: { id: entityId },
        });
        return !!testPlan;
      case 'TEST_CYCLE':
        const testCycle = await prisma.testCycle.findUnique({
          where: { id: entityId },
        });
        return !!testCycle;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { canEdit } from '@/lib/permissions';

const testPlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
});

// GET /api/test-plans - List test plans
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const status = searchParams.get('status');
    const ownerId = searchParams.get('ownerId');
    const search = searchParams.get('search');

    const where: any = {};

    if (status) where.status = status;
    if (ownerId) where.ownerId = ownerId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [testPlans, total] = await Promise.all([
      prisma.testPlan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
          testCases: {
            include: {
              testCase: {
                select: { id: true, title: true, status: true },
              },
            },
          },
          _count: {
            select: { testCases: true, testCycles: true },
          },
        },
      }),
      prisma.testPlan.count({ where }),
    ]);

    return NextResponse.json({
      testPlans,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching test plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test plans' },
      { status: 500 }
    );
  }
}

// POST /api/test-plans - Create new test plan
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
    const validatedData = testPlanSchema.parse(body);

    const testPlan = await prisma.testPlan.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        status: validatedData.status || 'DRAFT',
        ownerId: session.user.id,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(testPlan, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating test plan:', error);
    return NextResponse.json(
      { error: 'Failed to create test plan' },
      { status: 500 }
    );
  }
}

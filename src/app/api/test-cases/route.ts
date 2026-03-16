import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const testCaseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  preconditions: z.string().optional(),
  steps: z.string().optional(),
  expectedResults: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'OBSOLETE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  type: z.enum(['FUNCTIONAL', 'REGRESSION', 'INTEGRATION', 'SMOKE', 'SECURITY', 'PERFORMANCE', 'USABILITY']).optional(),
  tags: z.array(z.string()).optional(),
  folderId: z.string().optional(),
});

// GET /api/test-cases - List test cases with filtering, pagination, and search
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
    const priority = searchParams.get('priority');
    const type = searchParams.get('type');
    const folderId = searchParams.get('folderId');
    const search = searchParams.get('search');
    const tag = searchParams.get('tag');

    const where: any = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (type) where.type = type;
    if (folderId) where.folderId = folderId;
    if (tag) where.tags = { has: tag };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [testCases, total] = await Promise.all([
      prisma.testCase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          folder: true,
          creator: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.testCase.count({ where }),
    ]);

    return NextResponse.json({
      testCases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching test cases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test cases' },
      { status: 500 }
    );
  }
}

// POST /api/test-cases - Create new test case
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = testCaseSchema.parse(body);

    const testCase = await prisma.testCase.create({
      data: {
        ...validatedData,
        steps: validatedData.steps || JSON.stringify([]),
        status: validatedData.status || 'DRAFT',
        priority: validatedData.priority || 'MEDIUM',
        type: validatedData.type || 'FUNCTIONAL',
        tags: validatedData.tags || [],
        createdById: session.user.id,
      },
      include: {
        folder: true,
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(testCase, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating test case:', error);
    return NextResponse.json(
      { error: 'Failed to create test case' },
      { status: 500 }
    );
  }
}

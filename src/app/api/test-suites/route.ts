import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const testSuiteSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

// GET /api/test-suites - List all test suites
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
    const search = searchParams.get('search');

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [testSuites, total] = await Promise.all([
      prisma.testSuite.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          suiteCases: {
            include: {
              testCase: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                },
              },
            },
          },
        },
      }),
      prisma.testSuite.count({ where }),
    ]);

    return NextResponse.json({
      testSuites: testSuites.map((suite) => ({
        ...suite,
        testCaseCount: suite.suiteCases.length,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching test suites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test suites' },
      { status: 500 }
    );
  }
}

// POST /api/test-suites - Create new test suite
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = testSuiteSchema.parse(body);

    const testSuite = await prisma.testSuite.create({
      data: validatedData,
    });

    return NextResponse.json(testSuite, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating test suite:', error);
    return NextResponse.json(
      { error: 'Failed to create test suite' },
      { status: 500 }
    );
  }
}

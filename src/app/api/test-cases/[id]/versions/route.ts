import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/test-cases/[id]/versions - Get all versions of a test case
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const versions = await prisma.testCaseVersion.findMany({
      where: { testCaseId: params.id },
      orderBy: { version: 'desc' },
      include: {
        testCase: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Get current version for comparison
    const currentTestCase = await prisma.testCase.findUnique({
      where: { id: params.id },
    });

    return NextResponse.json({
      versions,
      current: currentTestCase,
    });
  } catch (error) {
    console.error('Error fetching versions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}

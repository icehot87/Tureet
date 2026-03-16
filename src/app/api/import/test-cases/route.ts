import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { canEdit } from '@/lib/permissions';

const testCaseImportSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'OBSOLETE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  type: z.enum(['FUNCTIONAL', 'REGRESSION', 'INTEGRATION', 'SMOKE', 'SECURITY', 'PERFORMANCE', 'USABILITY']).optional(),
  tags: z.array(z.string()).optional(),
});

// POST /api/import/test-cases - Import test cases
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canEdit(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const testCases = Array.isArray(body) ? body : [body];

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const testCase of testCases) {
      try {
        const validated = testCaseImportSchema.parse(testCase);
        
        await prisma.testCase.create({
          data: {
            ...validated,
            steps: JSON.stringify([]),
            createdById: session.user.id,
          },
        });
        results.success++;
      } catch (error) {
        results.failed++;
        if (error instanceof z.ZodError) {
          results.errors.push(`${testCase.title || 'Unknown'}: ${error.errors.map(e => e.message).join(', ')}`);
        } else {
          results.errors.push(`${testCase.title || 'Unknown'}: ${(error as Error).message}`);
        }
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error importing test cases:', error);
    return NextResponse.json(
      { error: 'Failed to import test cases' },
      { status: 500 }
    );
  }
}

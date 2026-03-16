import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const customFieldValueSchema = z.object({
  customFieldId: z.string(),
  entityType: z.enum(['TEST_CASE', 'TEST_RUN', 'TEST_PLAN', 'TEST_CYCLE']),
  entityId: z.string(),
  value: z.string().nullable().optional(),
});

// GET /api/custom-field-values - Get custom field values for an entity
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

    const values = await prisma.customFieldValue.findMany({
      where: {
        entityType: entityType as any,
        entityId,
      },
      include: {
        customField: true,
      },
    });

    return NextResponse.json({ values });
  } catch (error) {
    console.error('Error fetching custom field values:', error);
    return NextResponse.json(
      { error: 'Failed to fetch custom field values' },
      { status: 500 }
    );
  }
}

// POST /api/custom-field-values - Set custom field value
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = customFieldValueSchema.parse(body);

    // Verify custom field exists
    const customField = await prisma.customField.findUnique({
      where: { id: validatedData.customFieldId },
    });

    if (!customField) {
      return NextResponse.json(
        { error: 'Custom field not found' },
        { status: 404 }
      );
    }

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

    // Upsert value
    const value = await prisma.customFieldValue.upsert({
      where: {
        customFieldId_entityType_entityId: {
          customFieldId: validatedData.customFieldId,
          entityType: validatedData.entityType as any,
          entityId: validatedData.entityId,
        },
      },
      update: {
        value: validatedData.value,
      },
      create: {
        customFieldId: validatedData.customFieldId,
        entityType: validatedData.entityType as any,
        entityId: validatedData.entityId,
        value: validatedData.value,
      },
      include: {
        customField: true,
      },
    });

    return NextResponse.json(value);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error setting custom field value:', error);
    return NextResponse.json(
      { error: 'Failed to set custom field value' },
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

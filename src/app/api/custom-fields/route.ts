import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { canEdit } from '@/lib/permissions';

const customFieldSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum([
    'TEXT',
    'NUMBER',
    'DATE',
    'DROPDOWN',
    'MULTI_SELECT',
    'CHECKBOX',
    'URL',
    'USER',
  ]),
  entityType: z.enum(['TEST_CASE', 'TEST_RUN', 'TEST_PLAN', 'TEST_CYCLE']),
  isRequired: z.boolean().optional().default(false),
  defaultValue: z.string().optional(),
  options: z.array(z.string()).optional().default([]),
  order: z.number().optional().default(0),
});

// GET /api/custom-fields - List custom fields
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get('entityType');

    const where: any = {};
    if (entityType) {
      where.entityType = entityType;
    }

    const customFields = await prisma.customField.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ customFields });
  } catch (error) {
    console.error('Error fetching custom fields:', error);
    return NextResponse.json(
      { error: 'Failed to fetch custom fields' },
      { status: 500 }
    );
  }
}

// POST /api/custom-fields - Create custom field
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
    const validatedData = customFieldSchema.parse(body);

    const customField = await prisma.customField.create({
      data: validatedData,
    });

    return NextResponse.json(customField, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    if ((error as any).code === 'P2002') {
      return NextResponse.json(
        { error: 'Custom field with this name already exists for this entity type' },
        { status: 409 }
      );
    }
    console.error('Error creating custom field:', error);
    return NextResponse.json(
      { error: 'Failed to create custom field' },
      { status: 500 }
    );
  }
}

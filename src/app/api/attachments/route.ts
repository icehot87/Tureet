import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { saveFile, validateFile, getMimeType } from '@/lib/storage';
import { z } from 'zod';

const uploadSchema = z.object({
  entityType: z.enum(['TEST_CASE', 'TEST_RUN', 'TEST_PLAN', 'TEST_CYCLE']),
  entityId: z.string(),
});

// POST /api/attachments - Upload attachment
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const entityType = formData.get('entityType') as string;
    const entityId = formData.get('entityId') as string;
    const file = formData.get('file') as File;

    // Validate inputs
    const validation = uploadSchema.safeParse({ entityType, entityId });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file
    const fileValidation = validateFile(file);
    if (!fileValidation.valid) {
      return NextResponse.json(
        { error: fileValidation.error },
        { status: 400 }
      );
    }

    // Verify entity exists
    const entityExists = await verifyEntityExists(entityType, entityId);
    if (!entityExists) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      );
    }

    // Save file
    const fileData = await saveFile(file);
    const mimeType = getMimeType(file.name);

    // Create attachment record
    const attachment = await prisma.attachment.create({
      data: {
        filename: fileData.filename,
        originalName: file.name,
        mimeType,
        size: fileData.size,
        path: fileData.path,
        entityType: entityType as any,
        entityId,
        uploadedById: session.user.id,
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    return NextResponse.json(
      { error: 'Failed to upload attachment' },
      { status: 500 }
    );
  }
}

// GET /api/attachments - List attachments for an entity
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

    const attachments = await prisma.attachment.findMany({
      where: {
        entityType: entityType as any,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ attachments });
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attachments' },
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

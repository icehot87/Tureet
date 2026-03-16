import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createActivity } from '@/lib/activity';
import { canEdit } from '@/lib/permissions';

// GET /api/test-cases/[id]/versions/[version] - Get specific version
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; version: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const version = parseInt(params.version);

    const versionData = await prisma.testCaseVersion.findUnique({
      where: {
        testCaseId_version: {
          testCaseId: params.id,
          version,
        },
      },
      include: {
        testCase: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!versionData) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(versionData);
  } catch (error) {
    console.error('Error fetching version:', error);
    return NextResponse.json(
      { error: 'Failed to fetch version' },
      { status: 500 }
    );
  }
}

// POST /api/test-cases/[id]/versions/[version]/restore - Restore a version
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; version: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canEdit(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const version = parseInt(params.version);

    const versionData = await prisma.testCaseVersion.findUnique({
      where: {
        testCaseId_version: {
          testCaseId: params.id,
          version,
        },
      },
    });

    if (!versionData) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    // Get current test case to create a new version
    const currentTestCase = await prisma.testCase.findUnique({
      where: { id: params.id },
    });

    if (!currentTestCase) {
      return NextResponse.json(
        { error: 'Test case not found' },
        { status: 404 }
      );
    }

    // Create version of current state
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

    // Restore from version
    const restoredTestCase = await prisma.testCase.update({
      where: { id: params.id },
      data: {
        title: versionData.title,
        description: versionData.description,
        preconditions: versionData.preconditions,
        steps: versionData.steps,
        expectedResults: versionData.expectedResults,
        status: versionData.status,
        priority: versionData.priority,
        type: versionData.type,
        tags: versionData.tags,
        requirementId: versionData.requirementId,
        folderId: versionData.folderId,
      },
      include: {
        folder: true,
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Log activity
    await createActivity({
      type: 'VERSION_CREATED',
      entityType: 'TEST_CASE',
      entityId: params.id,
      userId: session.user.id,
      details: { restoredFromVersion: version, newVersion: nextVersion },
    });

    return NextResponse.json(restoredTestCase);
  } catch (error) {
    console.error('Error restoring version:', error);
    return NextResponse.json(
      { error: 'Failed to restore version' },
      { status: 500 }
    );
  }
}

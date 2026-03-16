import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/export/test-cases - Export test cases
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json';

    const testCases = await prisma.testCase.findMany({
      include: {
        creator: {
          select: { name: true, email: true },
        },
        folder: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const exportData = testCases.map((tc) => ({
      id: tc.id,
      title: tc.title,
      description: tc.description,
      status: tc.status,
      priority: tc.priority,
      type: tc.type,
      tags: tc.tags.join(', '),
      folder: tc.folder?.name || '',
      creator: tc.creator.email,
      createdAt: tc.createdAt.toISOString(),
      updatedAt: tc.updatedAt.toISOString(),
    }));

    if (format === 'csv') {
      const csv = [
        Object.keys(exportData[0] || {}).join(','),
        ...exportData.map((row) =>
          Object.values(row)
            .map((val) => (val ? `"${String(val).replace(/"/g, '""')}"` : ''))
            .join(',')
        ),
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="test-cases-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json(exportData, {
      headers: {
        'Content-Disposition': `attachment; filename="test-cases-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting test cases:', error);
    return NextResponse.json(
      { error: 'Failed to export test cases' },
      { status: 500 }
    );
  }
}

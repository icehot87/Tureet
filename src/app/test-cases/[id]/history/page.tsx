'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RotateCcw, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Version {
  id: string;
  version: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  type: string;
  createdAt: string;
}

interface CurrentTestCase {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  type: string;
  updatedAt: string;
}

export default function TestCaseHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [versions, setVersions] = useState<Version[]>([]);
  const [current, setCurrent] = useState<CurrentTestCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [comparingVersions, setComparingVersions] = useState<{
    v1: number | null;
    v2: number | null;
  }>({ v1: null, v2: null });

  useEffect(() => {
    if (id) {
      fetchVersions();
    }
  }, [id]);

  const fetchVersions = async () => {
    try {
      const response = await fetch(`/api/test-cases/${id}/versions`);
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);
        setCurrent(data.current);
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (version: number) => {
    if (!confirm(`Restore version ${version}? This will create a new version from the current state.`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/test-cases/${id}/versions/${version}/restore`,
        { method: 'POST' }
      );

      if (response.ok) {
        alert('Version restored successfully');
        router.push(`/test-cases/${id}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to restore version');
      }
    } catch (error) {
      console.error('Error restoring version:', error);
      alert('Failed to restore version');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const allVersions = current
    ? [
        {
          ...current,
          version: 'current',
          isCurrent: true,
        } as any,
        ...versions,
      ]
    : versions;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push(`/test-cases/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Test Case
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Version History</h1>
            <p className="text-gray-600 mt-2">
              View and restore previous versions of this test case
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Versions ({allVersions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allVersions.map((version, index) => (
              <div
                key={version.id || 'current'}
                className="border rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={version.isCurrent ? 'default' : 'outline'}>
                      {version.isCurrent ? 'Current' : `v${version.version}`}
                    </Badge>
                    <div>
                      <h3 className="font-medium">{version.title}</h3>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">{version.status}</Badge>
                        <Badge variant="outline">{version.priority}</Badge>
                        <Badge variant="outline">{version.type}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(
                          new Date(version.createdAt || version.updatedAt),
                          { addSuffix: true }
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!version.isCurrent && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(version.version)}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restore
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setSelectedVersion(
                              selectedVersion === version.version ? null : version.version
                            )
                          }
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {selectedVersion === version.version ? 'Hide' : 'View'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {selectedVersion === version.version && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="space-y-2 text-sm">
                      {version.description && (
                        <div>
                          <span className="font-medium">Description: </span>
                          <span>{version.description}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

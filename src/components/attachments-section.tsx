'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, FileText, Image, File, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedBy: {
    id: string;
    name?: string;
    email: string;
  };
  createdAt: string;
}

interface AttachmentsSectionProps {
  entityType: 'TEST_CASE' | 'TEST_RUN' | 'TEST_PLAN' | 'TEST_CYCLE';
  entityId: string;
  canUpload?: boolean;
}

export function AttachmentsSection({
  entityType,
  entityId,
  canUpload = true,
}: AttachmentsSectionProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fileInput, setFileInput] = useState<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchAttachments();
  }, [entityType, entityId]);

  const fetchAttachments = async () => {
    try {
      const response = await fetch(
        `/api/attachments?entityType=${entityType}&entityId=${entityId}`
      );
      if (response.ok) {
        const data = await response.json();
        setAttachments(data.attachments || []);
      }
    } catch (error) {
      console.error('Error fetching attachments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await handleUpload(file);
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', entityType);
      formData.append('entityId', entityId);

      const response = await fetch('/api/attachments', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const attachment = await response.json();
        setAttachments([attachment, ...attachments]);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this attachment?')) return;

    try {
      const response = await fetch(`/api/attachments/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAttachments(attachments.filter((a) => a.id !== id));
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete attachment');
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      alert('Failed to delete attachment');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (mimeType === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading attachments...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Attachments ({attachments.length})</CardTitle>
          {canUpload && (
            <div>
              <Input
                ref={setFileInput}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                disabled={uploading}
                accept="image/*,application/pdf,text/*,.csv,.xlsx,.xml,.json"
              />
              <Button
                size="sm"
                onClick={() => fileInput?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {attachments.length === 0 ? (
          <p className="text-sm text-gray-500">
            No attachments yet. Click Upload to add files.
          </p>
        ) : (
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3 flex-1">
                  {getFileIcon(attachment.mimeType)}
                  <div className="flex-1 min-w-0">
                    <a
                      href={attachment.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:underline block truncate"
                    >
                      {attachment.originalName}
                    </a>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(attachment.size)} •{' '}
                      {formatDistanceToNow(new Date(attachment.createdAt), {
                        addSuffix: true,
                      })}{' '}
                      by {attachment.uploadedBy.name || attachment.uploadedBy.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(attachment.path, '_blank')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {canUpload && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(attachment.id)}
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { writeFile, mkdir, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

// Ensure upload directory exists
export async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// Generate unique filename
export function generateFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  const baseName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-z0-9]/gi, '_');
  return `${baseName}_${timestamp}_${randomStr}.${extension}`;
}

// Save file to disk
export async function saveFile(file: File): Promise<{ filename: string; path: string; size: number }> {
  await ensureUploadDir();
  
  const filename = generateFilename(file.name);
  const filePath = join(UPLOAD_DIR, filename);
  
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  await writeFile(filePath, buffer);
  
  return {
    filename,
    path: `/uploads/${filename}`,
    size: buffer.length,
  };
}

// Delete file from disk
export async function deleteFile(path: string): Promise<void> {
  // Extract filename from path (could be /uploads/filename or full path)
  const filename = path.replace(/^.*\/uploads\//, '');
  const filePath = join(UPLOAD_DIR, filename);
  
  if (existsSync(filePath)) {
    await unlink(filePath);
  }
}

// Get MIME type from filename
export function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    pdf: 'application/pdf',
    txt: 'text/plain',
    csv: 'text/csv',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xml: 'application/xml',
    json: 'application/json',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

// Validate file
export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/xml',
    'application/json',
  ];

  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }

  return { valid: true };
}

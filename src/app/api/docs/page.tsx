'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const apiEndpoints = [
  {
    method: 'GET',
    path: '/api/test-cases',
    description: 'List all test cases with pagination and filters',
    auth: true,
    params: ['page', 'limit', 'status', 'priority', 'type', 'search'],
  },
  {
    method: 'POST',
    path: '/api/test-cases',
    description: 'Create a new test case',
    auth: true,
    body: {
      title: 'string (required)',
      description: 'string',
      status: 'DRAFT | ACTIVE | OBSOLETE',
      priority: 'LOW | MEDIUM | HIGH | CRITICAL',
    },
  },
  {
    method: 'GET',
    path: '/api/test-cases/[id]',
    description: 'Get test case details by ID',
    auth: true,
  },
  {
    method: 'PUT',
    path: '/api/test-cases/[id]',
    description: 'Update a test case',
    auth: true,
  },
  {
    method: 'GET',
    path: '/api/test-plans',
    description: 'List all test plans',
    auth: true,
  },
  {
    method: 'GET',
    path: '/api/test-runs',
    description: 'List all test runs',
    auth: true,
  },
  {
    method: 'GET',
    path: '/api/test-suites',
    description: 'List all test suites',
    auth: true,
  },
  {
    method: 'POST',
    path: '/api/attachments',
    description: 'Upload a file attachment (multipart/form-data)',
    auth: true,
    body: {
      file: 'File (required)',
      entityType: 'TEST_CASE | TEST_RUN | TEST_PLAN | TEST_CYCLE',
      entityId: 'string (required)',
    },
  },
  {
    method: 'GET',
    path: '/api/comments',
    description: 'Get comments for an entity',
    auth: true,
    params: ['entityType', 'entityId'],
  },
  {
    method: 'POST',
    path: '/api/comments',
    description: 'Create a comment',
    auth: true,
    body: {
      content: 'string (required)',
      entityType: 'string (required)',
      entityId: 'string (required)',
    },
  },
  {
    method: 'GET',
    path: '/api/activity',
    description: 'Get activity log',
    auth: true,
    params: ['entityType', 'entityId', 'limit', 'offset'],
  },
  {
    method: 'GET',
    path: '/api/custom-fields',
    description: 'List custom fields',
    auth: true,
    params: ['entityType'],
  },
  {
    method: 'GET',
    path: '/api/export/test-cases',
    description: 'Export test cases as CSV or JSON',
    auth: true,
    params: ['format=json|csv'],
  },
];

export default function APIDocsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">API Documentation</h1>
        <p className="text-gray-600 mt-2">
          REST API endpoints for programmatic access to the test management system
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4">
            All API endpoints require authentication. Include the session cookie in your requests,
            or use NextAuth session management.
          </p>
          <code className="text-sm bg-gray-100 p-2 rounded block">
            Cookie: next-auth.session-token=...
          </code>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Base URL</CardTitle>
        </CardHeader>
        <CardContent>
          <code className="text-sm bg-gray-100 p-2 rounded block">
            {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}
          </code>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Endpoints</h2>
        {apiEndpoints.map((endpoint, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    endpoint.method === 'GET'
                      ? 'default'
                      : endpoint.method === 'POST'
                      ? 'default'
                      : endpoint.method === 'PUT'
                      ? 'default'
                      : 'default'
                  }
                >
                  {endpoint.method}
                </Badge>
                <code className="text-sm font-mono">{endpoint.path}</code>
                {endpoint.auth && (
                  <Badge variant="outline" className="ml-auto">
                    Auth Required
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-2">{endpoint.description}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {endpoint.params && (
                <div>
                  <p className="text-sm font-medium mb-1">Query Parameters:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {endpoint.params.map((param, i) => (
                      <li key={i}>
                        <code>{param}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {endpoint.body && (
                <div>
                  <p className="text-sm font-medium mb-1">Request Body:</p>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                    {JSON.stringify(endpoint.body, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Example Request</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="fetch">
            <TabsList>
              <TabsTrigger value="fetch">JavaScript (Fetch)</TabsTrigger>
              <TabsTrigger value="curl">cURL</TabsTrigger>
            </TabsList>
            <TabsContent value="fetch" className="mt-4">
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-x-auto">
                {`fetch('/api/test-cases', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
})
.then(res => res.json())
.then(data => console.log(data));`}
              </pre>
            </TabsContent>
            <TabsContent value="curl" className="mt-4">
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-x-auto">
                {`curl -X GET \\
  'http://localhost:3000/api/test-cases' \\
  -H 'Cookie: next-auth.session-token=YOUR_TOKEN'`}
              </pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

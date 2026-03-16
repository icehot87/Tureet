'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface DashboardStats {
  totalTestCases: number;
  activeTestCases: number;
  totalTestPlans: number;
  activeTestPlans: number;
  totalTestRuns: number;
  passedRuns: number;
  failedRuns: number;
  blockedRuns: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [testCasesRes, testPlansRes, testRunsRes] = await Promise.all([
        fetch('/api/test-cases?limit=1').catch(err => {
          console.error('[ERROR] Dashboard: test-cases fetch failed', err);
          return { json: async () => ({ testCases: [], pagination: { total: 0 } }) };
        }),
        fetch('/api/test-plans?limit=1').catch(err => {
          console.error('[ERROR] Dashboard: test-plans fetch failed', err);
          return { json: async () => ({ testPlans: [], pagination: { total: 0 } }) };
        }),
        fetch('/api/test-runs').catch(err => {
          console.error('[ERROR] Dashboard: test-runs fetch failed', err);
          return { json: async () => ({ testRuns: [] }) };
        }),
      ]);

      const testCasesData = await testCasesRes.json();
      const testPlansData = await testPlansRes.json();
      const testRunsData = await testRunsRes.json();

      const activeCases = testCasesData.testCases?.filter(
        (tc: any) => tc.status === 'ACTIVE'
      ).length || 0;
      
      const activePlans = testPlansData.testPlans?.filter(
        (tp: any) => tp.status === 'ACTIVE'
      ).length || 0;

      const runs = testRunsData.testRuns || [];
      const passed = runs.filter((r: any) => r.status === 'PASSED').length;
      const failed = runs.filter((r: any) => r.status === 'FAILED').length;
      const blocked = runs.filter((r: any) => r.status === 'BLOCKED').length;

      setStats({
        totalTestCases: testCasesData.pagination?.total || 0,
        activeTestCases: activeCases,
        totalTestPlans: testPlansData.pagination?.total || 0,
        activeTestPlans: activePlans,
        totalTestRuns: runs.length,
        passedRuns: passed,
        failedRuns: failed,
        blockedRuns: blocked,
      });
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const passRate = stats && stats.totalTestRuns > 0
    ? ((stats.passedRuns / stats.totalTestRuns) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your test management system</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Test Cases</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTestCases || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeTestCases || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Plans</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTestPlans || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeTestPlans || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Runs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTestRuns || 0}</div>
            <p className="text-xs text-muted-foreground">
              Pass rate: {passRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Results</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.passedRuns || 0}
            </div>
            <div className="flex space-x-4 mt-2 text-xs">
              <span className="text-red-600">
                Failed: {stats?.failedRuns || 0}
              </span>
              <span className="text-yellow-600">
                Blocked: {stats?.blockedRuns || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

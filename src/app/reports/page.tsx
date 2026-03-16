'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, FileText, Download, TrendingUp, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Link from 'next/link';

interface ReportData {
  totalTestCases: number;
  activeTestCases: number;
  totalTestPlans: number;
  totalTestRuns: number;
  passedRuns: number;
  failedRuns: number;
  blockedRuns: number;
  skippedRuns: number;
  notStartedRuns: number;
}

interface TrendData {
  date: string;
  passed: number;
  failed: number;
  total: number;
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#6366f1', '#8b5cf6'];

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
    fetchTrendData();
  }, []);

  const fetchReportData = async () => {
    try {
      const [testCasesRes, testPlansRes, testRunsRes] = await Promise.all([
        fetch('/api/test-cases?limit=1'),
        fetch('/api/test-plans?limit=1'),
        fetch('/api/test-runs'),
      ]);

      const testCasesData = await testCasesRes.json();
      const testPlansData = await testPlansRes.json();
      const testRunsData = await testRunsRes.json();

      const runs = testRunsData.testRuns || [];
      const passed = runs.filter((r: any) => r.status === 'PASSED').length;
      const failed = runs.filter((r: any) => r.status === 'FAILED').length;
      const blocked = runs.filter((r: any) => r.status === 'BLOCKED').length;
      const skipped = runs.filter((r: any) => r.status === 'SKIPPED').length;
      const notStarted = runs.filter((r: any) => r.status === 'NOT_STARTED').length;

      const activeCases = testCasesData.testCases?.filter(
        (tc: any) => tc.status === 'ACTIVE'
      ).length || 0;

      setReportData({
        totalTestCases: testCasesData.pagination?.total || 0,
        activeTestCases: activeCases,
        totalTestPlans: testPlansData.pagination?.total || 0,
        totalTestRuns: runs.length,
        passedRuns: passed,
        failedRuns: failed,
        blockedRuns: blocked,
        skippedRuns: skipped,
        notStartedRuns: notStarted,
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendData = async () => {
    try {
      const response = await fetch('/api/test-runs');
      const data = await response.json();
      const runs = data.testRuns || [];

      // Group by date (last 7 days)
      const today = new Date();
      const trendMap = new Map<string, { passed: number; failed: number; total: number }>();

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        trendMap.set(dateStr, { passed: 0, failed: 0, total: 0 });
      }

      runs.forEach((run: any) => {
        if (run.executedAt) {
          const dateStr = new Date(run.executedAt).toISOString().split('T')[0];
          const existing = trendMap.get(dateStr);
          if (existing) {
            existing.total++;
            if (run.status === 'PASSED') existing.passed++;
            if (run.status === 'FAILED') existing.failed++;
          }
        }
      });

      const trend: TrendData[] = Array.from(trendMap.entries()).map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ...data,
      }));

      setTrendData(trend);
    } catch (error) {
      console.error('Error fetching trend data:', error);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const csv = [
      ['Metric', 'Value'],
      ['Total Test Cases', reportData.totalTestCases],
      ['Active Test Cases', reportData.activeTestCases],
      ['Total Test Plans', reportData.totalTestPlans],
      ['Total Test Runs', reportData.totalTestRuns],
      ['Passed Runs', reportData.passedRuns],
      ['Failed Runs', reportData.failedRuns],
      ['Blocked Runs', reportData.blockedRuns],
      ['Skipped Runs', reportData.skippedRuns],
      ['Not Started Runs', reportData.notStartedRuns],
      ['Pass Rate', reportData.totalTestRuns > 0 ? ((reportData.passedRuns / reportData.totalTestRuns) * 100).toFixed(2) + '%' : '0%'],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!reportData) {
    return <div>No data available</div>;
  }

  const passRate = reportData.totalTestRuns > 0
    ? ((reportData.passedRuns / reportData.totalTestRuns) * 100).toFixed(1)
    : '0';

  const statusData = [
    { name: 'Passed', value: reportData.passedRuns, color: '#10b981' },
    { name: 'Failed', value: reportData.failedRuns, color: '#ef4444' },
    { name: 'Blocked', value: reportData.blockedRuns, color: '#f59e0b' },
    { name: 'Skipped', value: reportData.skippedRuns, color: '#6366f1' },
    { name: 'Not Started', value: reportData.notStartedRuns, color: '#9ca3af' },
  ].filter(item => item.value > 0);

  const barData = [
    { name: 'Test Cases', value: reportData.totalTestCases },
    { name: 'Test Plans', value: reportData.totalTestPlans },
    { name: 'Test Runs', value: reportData.totalTestRuns },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive test execution statistics and trends
          </p>
        </div>
        <Button onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Test Cases</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalTestCases}</div>
            <p className="text-xs text-muted-foreground">
              {reportData.activeTestCases} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Plans</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalTestPlans}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Runs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalTestRuns}</div>
            <p className="text-xs text-muted-foreground">
              Pass rate: {passRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{passRate}%</div>
            <p className="text-xs text-muted-foreground">
              {reportData.passedRuns} passed / {reportData.totalTestRuns} total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Test Execution Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Execution Trends (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="passed" stroke="#10b981" name="Passed" />
              <Line type="monotone" dataKey="failed" stroke="#ef4444" name="Failed" />
              <Line type="monotone" dataKey="total" stroke="#6366f1" name="Total" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/test-cases">
              <Button variant="outline" className="w-full">
                View Test Cases
              </Button>
            </Link>
            <Link href="/test-runs">
              <Button variant="outline" className="w-full">
                View Test Runs
              </Button>
            </Link>
            <Link href="/test-plans">
              <Button variant="outline" className="w-full">
                View Test Plans
              </Button>
            </Link>
            <Link href="/reports/coverage">
              <Button variant="outline" className="w-full">
                Coverage Report
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import Link from 'next/link';

const stats = [
  { name: 'Total Test Cases', value: '0', href: '/dashboard/test-cases' },
  { name: 'Test Suites', value: '0', href: '/dashboard/test-suites' },
  { name: 'Test Plans', value: '0', href: '/dashboard/test-plans' },
  { name: 'Recent Executions', value: '0', href: '/dashboard/executions' },
];

export default function Dashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-700">
          Welcome to your test management dashboard. Here's an overview of your testing activities.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 hover:shadow-md transition-shadow"
          >
            <dt>
              <p className="truncate text-sm font-medium text-gray-500">{stat.name}</p>
            </dt>
            <dd className="mt-1">
              <p className="text-3xl font-semibold text-gray-900">{stat.value}</p>
            </dd>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Activity</h3>
            <div className="mt-6">
              <p className="text-center text-sm text-gray-500 py-4">No recent activity</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Quick Actions</h3>
            <div className="mt-6 grid grid-cols-1 gap-4">
              <Link
                href="/dashboard/test-cases/new"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Create Test Case
              </Link>
              <Link
                href="/dashboard/test-suites/new"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-white px-4 py-2 text-sm font-medium text-indigo-600 shadow-sm ring-1 ring-inset ring-indigo-600 hover:bg-indigo-50"
              >
                Create Test Suite
              </Link>
              <Link
                href="/dashboard/test-plans/new"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-white px-4 py-2 text-sm font-medium text-indigo-600 shadow-sm ring-1 ring-inset ring-indigo-600 hover:bg-indigo-50"
              >
                Create Test Plan
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
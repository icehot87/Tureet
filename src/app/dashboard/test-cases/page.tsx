'use client';

import Link from 'next/link';

const testCases = [
  // Sample data - will be replaced with real data from the database
  {
    id: '1',
    title: 'User Login Test',
    status: 'Active',
    priority: 'High',
    lastRun: '2024-03-30',
    result: 'Passed',
  },
  // Add more sample test cases here
];

export default function TestCases() {
  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Test Cases</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all test cases in your organization.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            href="/dashboard/test-cases/new"
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Add Test Case
          </Link>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Title
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Priority
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Last Run
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Result
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {testCases.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-sm text-gray-500">
                        No test cases found. Create your first test case to get started.
                      </td>
                    </tr>
                  ) : (
                    testCases.map((testCase) => (
                      <tr key={testCase.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {testCase.title}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{testCase.status}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{testCase.priority}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{testCase.lastRun}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{testCase.result}</td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link href={`/dashboard/test-cases/${testCase.id}`} className="text-indigo-600 hover:text-indigo-900">
                            View<span className="sr-only">, {testCase.title}</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
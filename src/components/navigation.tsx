'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  PlayCircle,
  BarChart3,
  LogOut,
  FolderTree,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Test Cases', href: '/test-cases', icon: FileText },
  { name: 'Test Suites', href: '/test-suites', icon: FolderTree },
  { name: 'Test Plans', href: '/test-plans', icon: Calendar },
  { name: 'Test Cycles', href: '/test-cycles', icon: PlayCircle },
  { name: 'Test Runs', href: '/test-runs', icon: PlayCircle },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
];

export function Navigation() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <div className="flex h-16 items-center justify-between border-b bg-white px-4">
      <div className="flex items-center space-x-8">
        <Link href="/" className="flex items-center space-x-2">
          <FileText className="h-6 w-6" />
          <span className="text-xl font-bold">Test Management</span>
        </Link>
        <nav className="flex space-x-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center space-x-4">
        {session?.user && (
          <>
            {session.user.role === 'ADMIN' && (
              <Link
                href="/admin/custom-fields"
                className={cn(
                  'text-sm font-medium transition-colors',
                  pathname === '/admin/custom-fields'
                    ? 'text-primary'
                    : 'text-gray-700 hover:text-gray-900'
                )}
              >
                Custom Fields
              </Link>
            )}
            <span className="text-sm text-gray-600">
              {session.user.name || session.user.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

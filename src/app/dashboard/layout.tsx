'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const navigation = [
  { name: 'Test Cases', href: '/dashboard/test-cases' },
  { name: 'Test Suites', href: '/dashboard/test-suites' },
  { name: 'Test Plans', href: '/dashboard/test-plans' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    try {
      // Disable the button to prevent multiple clicks
      const signOutButton = document.querySelector('button[onClick="handleSignOut"]');
      if (signOutButton) {
        signOutButton.setAttribute('disabled', 'true');
      }

      // Clear any client-side session data
      await signOut({ 
        redirect: true,
        callbackUrl: '/'
      });

      // Clear any local storage or session storage items
      localStorage.clear();
      sessionStorage.clear();

      // Clear all cookies using for...of
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name] = cookie.trim().split('=');
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }

      // Use a timeout to ensure the sign out process completes
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    } catch (error) {
      console.error('Error signing out:', error);
      // If there's an error, still try to clear everything and redirect
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-indigo-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link href="/dashboard" className="text-white text-xl font-bold">
                  Tureet
                </Link>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {navigation.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                        className={`${
                          isActive
                            ? 'bg-indigo-700 text-white'
                            : 'text-white hover:bg-indigo-500'
                        } rounded-md px-3 py-2 text-sm font-medium`}
                      >
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <div className="flex items-center gap-4">
                  <span className="text-white">{session?.user?.email}</span>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile navigation */}
      <nav className="md:hidden bg-indigo-600 border-t border-indigo-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  data-testid={`mobile-nav-${item.name.toLowerCase().replace(' ', '-')}`}
                  className={`${
                    isActive
                      ? 'bg-indigo-700 text-white'
                      : 'text-white hover:bg-indigo-500'
                  } px-3 py-2 text-sm font-medium flex-1 text-center`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
} 
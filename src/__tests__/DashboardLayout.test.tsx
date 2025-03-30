import { render, screen, fireEvent } from '@testing-library/react';
import DashboardLayout from '../app/dashboard/layout';

let mockPathname = '/dashboard';

// Mock next-auth and next/navigation
jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
  useSession: () => ({
    data: {
      user: {
        email: 'test@example.com',
      },
    },
    status: 'authenticated',
  }),
}));

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

describe('DashboardLayout', () => {
  const mockSignOut = jest.requireMock('next-auth/react').signOut;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = '/dashboard';
  });

  it('renders navigation items', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const desktopNav = screen.getAllByRole('navigation')[0];
    expect(desktopNav).toBeInTheDocument();
    expect(desktopNav.querySelector('a[href="/dashboard/test-cases"]')).toHaveTextContent('Test Cases');
    expect(desktopNav.querySelector('a[href="/dashboard/test-suites"]')).toHaveTextContent('Test Suites');
    expect(desktopNav.querySelector('a[href="/dashboard/test-plans"]')).toHaveTextContent('Test Plans');
  });

  it('displays user email and sign out button', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Sign out')).toBeInTheDocument();
  });

  it('handles sign out', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const signOutButton = screen.getByText('Sign out');
    fireEvent.click(signOutButton);

    expect(mockSignOut).toHaveBeenCalled();
  });

  it('highlights active navigation item', () => {
    mockPathname = '/dashboard/test-cases';

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const testCasesLink = screen.getAllByText('Test Cases')[0].closest('a');
    expect(testCasesLink).toHaveClass('bg-indigo-700');
  });

  it('renders children content', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders mobile navigation', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const mobileNav = screen.getAllByRole('navigation')[1];
    expect(mobileNav).toHaveClass('md:hidden');
  });
}); 
import { render, screen, fireEvent, within } from '@testing-library/react';
import DashboardLayout from '../app/dashboard/layout';

let mockPathname = '/dashboard';
const mockPush = jest.fn();

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

jest.mock('next/navigation', () => {
  return {
    usePathname: () => mockPathname,
    useRouter: () => ({
      push: mockPush,
    }),
  };
});

describe('DashboardLayout', () => {
  const mockSignOut = jest.requireMock('next-auth/react').signOut;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = '/dashboard';
    mockPush.mockClear();
  });

  it('renders navigation items', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const desktopNav = screen.getAllByRole('navigation')[0];
    expect(desktopNav).toBeInTheDocument();
    
    // Test desktop navigation
    const desktopLinks = within(desktopNav).getAllByRole('link');
    expect(desktopLinks).toHaveLength(4); // Including the Tureet link
    expect(desktopLinks[1]).toHaveTextContent('Test Cases');
    expect(desktopLinks[2]).toHaveTextContent('Test Suites');
    expect(desktopLinks[3]).toHaveTextContent('Test Plans');
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

  it('handles sign out', async () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const signOutButton = screen.getByText('Sign out');
    await fireEvent.click(signOutButton);

    expect(mockSignOut).toHaveBeenCalledWith({ 
      redirect: true,
      callbackUrl: '/'
    });
  });

  it('highlights active navigation item', () => {
    // Set the pathname before rendering
    mockPathname = '/dashboard/test-cases';

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const desktopNav = screen.getAllByRole('navigation')[0];
    const testCasesLink = within(desktopNav).getByRole('link', { name: 'Test Cases' });
    const testSuitesLink = within(desktopNav).getByRole('link', { name: 'Test Suites' });

    console.log('Current pathname:', mockPathname);
    console.log('Test Cases Link className:', testCasesLink.className);
    console.log('Test Suites Link className:', testSuitesLink.className);
    console.log('Test Cases Link:', testCasesLink.outerHTML);
    console.log('Test Suites Link:', testSuitesLink.outerHTML);

    // Active link should have bg-indigo-700 class
    expect(testCasesLink.className).toMatch(/\bbg-indigo-700\b/);
    expect(testCasesLink.className).not.toMatch(/\bhover:bg-indigo-500\b/);

    // Inactive link should not have bg-indigo-700 class
    expect(testSuitesLink.className).not.toMatch(/\bbg-indigo-700\b/);
    expect(testSuitesLink.className).toMatch(/\bhover:bg-indigo-500\b/);
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
    
    const mobileLinks = within(mobileNav).getAllByRole('link');
    expect(mobileLinks).toHaveLength(3);
    expect(mobileLinks[0]).toHaveTextContent('Test Cases');
    expect(mobileLinks[1]).toHaveTextContent('Test Suites');
    expect(mobileLinks[2]).toHaveTextContent('Test Plans');
  });
}); 
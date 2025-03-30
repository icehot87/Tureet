import { render, screen } from '@testing-library/react';
import Dashboard from '../app/dashboard/page';

describe('Dashboard', () => {
  it('renders dashboard title and description', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(
      screen.getByText(/Welcome to your test management dashboard/i)
    ).toBeInTheDocument();
  });

  it('renders all stat cards', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('Total Test Cases')).toBeInTheDocument();
    expect(screen.getByText('Test Suites')).toBeInTheDocument();
    expect(screen.getByText('Test Plans')).toBeInTheDocument();
    expect(screen.getByText('Recent Executions')).toBeInTheDocument();
  });

  it('renders recent activity section', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('No recent activity')).toBeInTheDocument();
  });

  it('renders quick actions section', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Create Test Case')).toBeInTheDocument();
    expect(screen.getByText('Create Test Suite')).toBeInTheDocument();
    expect(screen.getByText('Create Test Plan')).toBeInTheDocument();
  });

  it('renders all quick action links with correct hrefs', () => {
    render(<Dashboard />);
    
    const createTestCaseLink = screen.getByText('Create Test Case').closest('a');
    const createTestSuiteLink = screen.getByText('Create Test Suite').closest('a');
    const createTestPlanLink = screen.getByText('Create Test Plan').closest('a');

    expect(createTestCaseLink).toHaveAttribute('href', '/dashboard/test-cases/new');
    expect(createTestSuiteLink).toHaveAttribute('href', '/dashboard/test-suites/new');
    expect(createTestPlanLink).toHaveAttribute('href', '/dashboard/test-plans/new');
  });

  it('renders all stat cards with links', () => {
    render(<Dashboard />);
    
    const stats = [
      { name: 'Total Test Cases', href: '/dashboard/test-cases' },
      { name: 'Test Suites', href: '/dashboard/test-suites' },
      { name: 'Test Plans', href: '/dashboard/test-plans' },
      { name: 'Recent Executions', href: '/dashboard/executions' },
    ];

    for (const { name, href } of stats) {
      const link = screen.getByText(name).closest('a');
      expect(link).toHaveAttribute('href', href);
    }
  });
}); 
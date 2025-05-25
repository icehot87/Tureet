import { render, screen } from '@testing-library/react';
import TestCasesPage from '../app/dashboard/test-cases/page';

describe('TestCasesPage', () => {
  it('renders test cases page', () => {
    render(<TestCasesPage />);
    expect(screen.getByText(/add test case/i)).toBeInTheDocument();
    expect(screen.getByText(/title/i)).toBeInTheDocument();
  });
}); 
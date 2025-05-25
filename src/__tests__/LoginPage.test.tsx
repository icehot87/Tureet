import { render, screen } from '@testing-library/react';
import LoginPage from '../app/auth/login/page';

describe('LoginPage', () => {
  it('renders login form', () => {
    render(<LoginPage />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
}); 
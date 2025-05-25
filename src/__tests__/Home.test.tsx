import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from '../app/page';

const mockPush = jest.fn();
const mockRefresh = jest.fn();

// Mock next-auth and next/navigation
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

describe('Home Component', () => {
  const mockSignIn = jest.requireMock('next-auth/react').signIn;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form', () => {
    render(<Home />);
    
    expect(screen.getAllByText('Welcome to Tureet')[0]).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    mockSignIn.mockResolvedValueOnce({ error: null });
    
    render(<Home />);
    
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password123',
        redirect: true,
        callbackUrl: '/dashboard'
      });
    });
  });

  it('handles login failure', async () => {
    mockSignIn.mockResolvedValueOnce({ error: 'Invalid credentials' });
    
    render(<Home />);
    
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('An error occurred. Please try again.')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    // Create a promise that we can resolve manually
    let resolveSignIn: ((value: { error: string | null }) => void) | undefined;
    const signInPromise = new Promise<{ error: string | null }>(resolve => {
      resolveSignIn = resolve;
    });
    mockSignIn.mockImplementation(() => signInPromise);
    
    render(<Home />);
    
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Fill in the form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Submit the form
    fireEvent.click(submitButton);

    // Wait for the loading state to be shown
    await waitFor(() => {
      expect(submitButton).toHaveTextContent('Signing in...');
      expect(submitButton).toBeDisabled();
    });

    // Resolve the signIn promise to complete the test
    if (resolveSignIn) {
      resolveSignIn({ error: null });
    }
  });
}); 
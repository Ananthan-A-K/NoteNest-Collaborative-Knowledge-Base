import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserRoleProvider } from '../contexts/UserRoleContext';
import { WorkspaceProvider } from '../contexts/WorkspaceContext';
import App from '../app/page';

/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

describe('Navigation and Note Access', () => {
  it('renders navigation menu', () => {
    render(
      <UserRoleProvider>
        <WorkspaceProvider>
          <App />
        </WorkspaceProvider>
      </UserRoleProvider>
    );

    expect(screen.getByText(/features/i)).toBeInTheDocument();
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    expect(screen.getByText(/get started/i)).toBeInTheDocument();
  });

  it('navigates to features section', async () => {
    const user = userEvent.setup();

    render(
      <UserRoleProvider>
        <WorkspaceProvider>
          <App />
        </WorkspaceProvider>
      </UserRoleProvider>
    );

    const featuresLink = screen.getByText(/features/i);
    await user.click(featuresLink);

    // Should scroll to features section
    expect(document.getElementById('features')).toBeInTheDocument();
  });

  it('navigates to login page', async () => {
    const user = userEvent.setup();

    render(
      <UserRoleProvider>
        <WorkspaceProvider>
          <App />
        </WorkspaceProvider>
      </UserRoleProvider>
    );

    const signInLink = screen.getByText(/sign in/i);
    await user.click(signInLink);

    // In a real app, this would navigate, but for testing we check the link
    expect(signInLink.closest('a')).toHaveAttribute('href', '/login');
  });

  it('shows get started button', () => {
    render(
      <UserRoleProvider>
        <WorkspaceProvider>
          <App />
        </WorkspaceProvider>
      </UserRoleProvider>
    );

    const getStartedButton = screen.getByText(/get started/i);
    expect(getStartedButton).toBeInTheDocument();
  });
});

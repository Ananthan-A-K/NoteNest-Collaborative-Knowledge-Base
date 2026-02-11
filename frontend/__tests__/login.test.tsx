import { render, screen } from '@testing-library/react';
import { UserRoleProvider } from '../contexts/UserRoleContext';
import App from '../app/page';

/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

describe('Login Flow', () => {
  it('renders app with login context', () => {
    render(
      <UserRoleProvider>
        <App />
      </UserRoleProvider>
    );

    expect(screen.getByText(/welcome to notenest/i)).toBeInTheDocument();
  });
});

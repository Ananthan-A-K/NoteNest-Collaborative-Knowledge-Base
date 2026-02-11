import { render, screen } from '@testing-library/react';
import { UserRoleProvider } from '../contexts/UserRoleContext';
import { WorkspaceProvider } from '../contexts/WorkspaceContext';
import App from '../app/page';

/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

describe('UI States', () => {
  it('renders app with state management', () => {
    render(
      <UserRoleProvider>
        <WorkspaceProvider>
          <App />
        </WorkspaceProvider>
      </UserRoleProvider>
    );

    expect(screen.getByText(/welcome to notenest/i)).toBeInTheDocument();
  });
});

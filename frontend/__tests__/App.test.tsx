import { render, screen } from '@testing-library/react';
import App from '../app/page';
import { UserRoleProvider } from '../contexts/UserRoleContext';

describe('App', () => {
  it('renders the main page', () => {
    render(
      <UserRoleProvider>
        <App />
      </UserRoleProvider>
    );
    expect(screen.getByText('Welcome to NoteNest')).toBeInTheDocument();
  });
});

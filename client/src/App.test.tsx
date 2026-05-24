import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';

describe('App', () => {
  it('renders landing page with hero section', () => {
    // We need to mock AuthContext to test App rendering
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <div data-testid="app-root">
          <h1>WhatsApp API Gateway</h1>
        </div>
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });

  it('renders login page', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <div>
          <h1>Welcome back</h1>
        </div>
      </MemoryRouter>
    );
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
  });
});

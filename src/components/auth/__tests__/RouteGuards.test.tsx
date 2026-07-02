import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { ProtectedRoute } from '../ProtectedRoute';
import { GuestRoute } from '../GuestRoute';

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

function renderWithRouter(
  element: React.ReactNode,
  initialPath: string,
) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      {element}
    </MemoryRouter>,
  );
}

// ─── ProtectedRoute ───────────────────────────────────────────────────────────

describe('ProtectedRoute', () => {
  it('renders the outlet when auth_token is in localStorage', () => {
    localStorage.setItem('auth_token', 'tok');
    renderWithRouter(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<div>Protected</div>} />
        </Route>
        <Route path="/login" element={<div>Login</div>} />
      </Routes>,
      '/home',
    );
    expect(screen.getByText('Protected')).toBeInTheDocument();
  });

  it('renders the outlet when auth_token is in sessionStorage', () => {
    sessionStorage.setItem('auth_token', 'tok');
    renderWithRouter(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<div>Protected</div>} />
        </Route>
        <Route path="/login" element={<div>Login</div>} />
      </Routes>,
      '/home',
    );
    expect(screen.getByText('Protected')).toBeInTheDocument();
  });

  it('redirects to /login when no token is present', () => {
    renderWithRouter(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<div>Protected</div>} />
        </Route>
        <Route path="/login" element={<div>Login</div>} />
      </Routes>,
      '/home',
    );
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.queryByText('Protected')).not.toBeInTheDocument();
  });
});

// ─── GuestRoute ───────────────────────────────────────────────────────────────

describe('GuestRoute', () => {
  it('renders the outlet when no token is present', () => {
    renderWithRouter(
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<div>Login</div>} />
        </Route>
        <Route path="/home" element={<div>Home</div>} />
      </Routes>,
      '/login',
    );
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('redirects to /home when auth_token is in localStorage', () => {
    localStorage.setItem('auth_token', 'tok');
    renderWithRouter(
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<div>Login</div>} />
        </Route>
        <Route path="/home" element={<div>Home</div>} />
      </Routes>,
      '/login',
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });

  it('redirects to /home when auth_token is in sessionStorage', () => {
    sessionStorage.setItem('auth_token', 'tok');
    renderWithRouter(
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<div>Login</div>} />
        </Route>
        <Route path="/home" element={<div>Home</div>} />
      </Routes>,
      '/login',
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });
});

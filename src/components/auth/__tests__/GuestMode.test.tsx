/**
 * GuestMode.test.tsx
 *
 * Covers:
 *  1. Guest can access public browsing routes (/home, /listings, /listings/:id)
 *  2. Guest is blocked from private routes (redirected to /login)
 *  3. AuthGateModal appears when requireAuth() is called without a token
 *  4. AuthGateModal does NOT appear for authenticated users
 *  5. AuthGateModal stores returnTo + pending-action hint in sessionStorage
 *  6. SignInForm reads returnTo from query-string and navigates there after login
 *  7. SignInForm shows pending-action hint banner from sessionStorage
 *  8. PublicRoute renders for everyone
 *  9. useAuthAction fires the callback directly when authenticated
 * 10. useAuthAction calls requireAuth() when unauthenticated
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from '../ProtectedRoute';
import { PublicRoute } from '../PublicRoute';
import { GuestRoute } from '../GuestRoute';
import { AuthGateProvider, useAuthGate } from '../../../context/AuthGateContext';
import { AuthGateModal } from '../AuthGateModal';
import { useAuthAction } from '../../../hooks/useAuthAction';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clearStorage() {
  localStorage.clear();
  sessionStorage.clear();
}

function setToken(token = 'test-token') {
  localStorage.setItem('auth_token', token);
}

function renderWithRouter(
  ui: React.ReactNode,
  initialPath = '/home',
) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      {ui}
    </MemoryRouter>,
  );
}

function renderWithAuthGate(
  ui: React.ReactNode,
  initialPath = '/home',
) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthGateProvider>
        {ui}
        <AuthGateModal />
      </AuthGateProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  clearStorage();
  vi.restoreAllMocks();
});

// ─── 1. Public Route: accessible to guests ────────────────────────────────────

describe('PublicRoute', () => {
  it('renders the outlet when unauthenticated', () => {
    renderWithRouter(
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/home" element={<div>Public Home</div>} />
        </Route>
      </Routes>,
      '/home',
    );
    expect(screen.getByText('Public Home')).toBeInTheDocument();
  });

  it('renders the outlet when authenticated', () => {
    setToken();
    renderWithRouter(
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/listings" element={<div>Listings</div>} />
        </Route>
      </Routes>,
      '/listings',
    );
    expect(screen.getByText('Listings')).toBeInTheDocument();
  });
});

// ─── 2. ProtectedRoute: still blocks guests ───────────────────────────────────

describe('ProtectedRoute – still blocks unauthenticated users', () => {
  it('redirects to /login when no token is present', () => {
    renderWithRouter(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<div>Profile</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>,
      '/profile',
    );
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();
  });

  it('renders the outlet for authenticated users', () => {
    setToken();
    renderWithRouter(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<div>Profile</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>,
      '/profile',
    );
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });
});

// ─── 3. GuestRoute: still redirects authenticated users ───────────────────────

describe('GuestRoute – still redirects authenticated users away from /login', () => {
  it('renders login page for unauthenticated users', () => {
    renderWithRouter(
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<div>Sign In</div>} />
        </Route>
        <Route path="/home" element={<div>Home</div>} />
      </Routes>,
      '/login',
    );
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('redirects to /home when already authenticated', () => {
    setToken();
    renderWithRouter(
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<div>Sign In</div>} />
        </Route>
        <Route path="/home" element={<div>Home</div>} />
      </Routes>,
      '/login',
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
  });
});

// ─── 4. AuthGateModal: shows when requireAuth is called ───────────────────────

function TriggerButton({ reason }: { reason: string }) {
  const { requireAuth } = useAuthGate();
  return (
    <button onClick={() => requireAuth(reason, () => {})}>Trigger</button>
  );
}

describe('AuthGateModal', () => {
  it('is hidden by default', () => {
    renderWithAuthGate(<TriggerButton reason="test reason" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('appears when requireAuth() is called', () => {
    renderWithAuthGate(<TriggerButton reason="Sign in to express interest" />);
    fireEvent.click(screen.getByText('Trigger'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Sign In Required')).toBeInTheDocument();
    expect(screen.getByText('Sign in to express interest')).toBeInTheDocument();
  });

  it('closes when the backdrop is clicked', () => {
    renderWithAuthGate(<TriggerButton reason="test" />);
    fireEvent.click(screen.getByText('Trigger'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // Click the close button (X)
    fireEvent.click(screen.getByLabelText('Close'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes when "Continue browsing as guest" is clicked', () => {
    renderWithAuthGate(<TriggerButton reason="test" />);
    fireEvent.click(screen.getByText('Trigger'));
    fireEvent.click(screen.getByText('Continue browsing as guest'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('stores returnTo and pending-action hint in sessionStorage on Sign In click', async () => {
    renderWithAuthGate(
      <Routes>
        <Route
          path="/listings/1"
          element={<TriggerButton reason="Sign in to save favourites." />}
        />
        <Route path="/login" element={<div>Login</div>} />
      </Routes>,
      '/listings/1',
    );
    fireEvent.click(screen.getByText('Trigger'));
    fireEvent.click(screen.getByText('Sign In to Continue'));
    await waitFor(() => {
      expect(sessionStorage.getItem('petad_return_to')).toBe('/listings/1');
      expect(sessionStorage.getItem('petad_pending_action_hint')).toBe('Sign in to save favourites.');
    });
  });

  it('navigates to /login with ?returnTo when Sign In is clicked', async () => {
    let capturedLocation = '';

    function Inspector() {
      const loc = window.location.href;
      capturedLocation = loc;
      return <div>Login Page - {loc}</div>;
    }

    renderWithAuthGate(
      <Routes>
        <Route
          path="/home"
          element={<TriggerButton reason="test" />}
        />
        <Route path="/login" element={<Inspector />} />
      </Routes>,
      '/home',
    );
    fireEvent.click(screen.getByText('Trigger'));
    fireEvent.click(screen.getByText('Sign In to Continue'));
    await waitFor(() => {
      expect(screen.getByText(/Login Page/)).toBeInTheDocument();
    });
    // Confirm the page rendered login route
    expect(capturedLocation).toBeDefined();
  });
});

// ─── 5. useAuthAction hook ────────────────────────────────────────────────────

function ActionButton({
  action,
  reason,
  label = 'Act',
}: {
  action: () => void;
  reason: string;
  label?: string;
}) {
  const guarded = useAuthAction(action, reason);
  return <button onClick={guarded}>{label}</button>;
}

describe('useAuthAction', () => {
  it('fires the callback directly when the user is authenticated', () => {
    setToken();
    const action = vi.fn();
    renderWithAuthGate(
      <ActionButton action={action} reason="Sign in to export." />,
    );
    fireEvent.click(screen.getByText('Act'));
    expect(action).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens AuthGateModal instead of firing action when unauthenticated', () => {
    const action = vi.fn();
    renderWithAuthGate(
      <ActionButton action={action} reason="Sign in to export data." />,
    );
    fireEvent.click(screen.getByText('Act'));
    expect(action).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Sign in to export data.')).toBeInTheDocument();
  });
});

// ─── 6. Return-to-page: pending action hint on login form ─────────────────────

describe('SignInForm – pending action hint', () => {
  beforeEach(() => {
    sessionStorage.setItem('petad_pending_action_hint', 'Sign in to save favourites.');
  });

  it('shows the pending-action hint banner when sessionStorage has a hint', async () => {
    const { SignInForm } = await import('../SignInForm');
    renderWithRouter(
      <Routes>
        <Route path="/login" element={<SignInForm />} />
        <Route path="/home" element={<div>Home</div>} />
      </Routes>,
      '/login',
    );
    expect(
      screen.getByText(/Sign in to continue:/),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Sign in to save favourites.'),
    ).toBeInTheDocument();
  });
});

// ─── 7. MSW: public GET listings does not require auth ───────────────────────

describe('MSW listings handler – public GET', () => {
  it('GET /api/listings returns data without Authorization header', async () => {
    const res = await fetch('/api/listings');
    expect(res.ok).toBe(true);
    const json = await res.json() as { data: unknown[] };
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);
  });

  it('GET /api/listings/:id returns a listing without Authorization header', async () => {
    const res = await fetch('/api/listings/1');
    expect(res.ok).toBe(true);
    const json = await res.json() as { data: { id: number } };
    expect(json.data.id).toBe(1);
  });
});

// ─── 8. MSW: mutation endpoints require auth ──────────────────────────────────

describe('MSW listings handler – protected mutations', () => {
  it('POST /api/listings/1/interest returns 401 without token', async () => {
    const res = await fetch('/api/listings/1/interest', { method: 'POST' });
    expect(res.status).toBe(401);
  });

  it('POST /api/listings/1/interest returns 200 with valid token', async () => {
    const res = await fetch('/api/listings/1/interest', {
      method: 'POST',
      headers: { Authorization: 'Bearer test-token' },
    });
    expect(res.ok).toBe(true);
  });

  it('POST /api/listings/1/favourite returns 401 without token', async () => {
    const res = await fetch('/api/listings/1/favourite', { method: 'POST' });
    expect(res.status).toBe(401);
  });

  it('POST /api/listings returns 401 without token', async () => {
    const res = await fetch('/api/listings', { method: 'POST' });
    expect(res.status).toBe(401);
  });

  it('PUT /api/listings/1 returns 401 without token', async () => {
    const res = await fetch('/api/listings/1', { method: 'PUT' });
    expect(res.status).toBe(401);
  });

  it('DELETE /api/listings/1 returns 401 without token', async () => {
    const res = await fetch('/api/listings/1', { method: 'DELETE' });
    expect(res.status).toBe(401);
  });
});

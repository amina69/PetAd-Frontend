import { http, HttpResponse, delay } from "msw";

// In-memory store of registered users for the mock
const registeredUsers: { email: string; fullName: string; nin: string; password: string; id: string }[] = [];

// Store for password reset tokens (maps token -> email)
const resetTokens: Map<string, string> = new Map();

export const authHandlers = [
  // POST /api/auth/register
  http.post("/api/auth/register", async ({ request }) => {
    await delay(400);

    const body = (await request.json()) as {
      email?: string;
      fullName?: string;
      nin?: string;
      password?: string;
    };

    if (!body.email || !body.fullName || !body.nin || !body.password) {
      return HttpResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    const exists = registeredUsers.some((u) => u.email === body.email);
    if (exists) {
      return HttpResponse.json(
        { message: "An account with this email already exists" },
        { status: 409 }
      );
    }

    registeredUsers.push({
      id: `user-${Date.now()}`,
      email: body.email,
      fullName: body.fullName,
      nin: body.nin,
      password: body.password,
    });

    return new HttpResponse(null, { status: 201 });
  }),

  // POST /api/auth/login
  http.post("/api/auth/login", async ({ request }) => {
    await delay(400);

    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!body.email || !body.password) {
      return HttpResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = registeredUsers.find(
      (u) => u.email === body.email && u.password === body.password
    );

    if (!user) {
      return HttpResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      token: `mock-token-${user.id}`,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: "USER",
      },
    });
  }),

  // POST /api/auth/request-password-reset
  http.post("/api/auth/request-password-reset", async ({ request }) => {
    await delay(600);

    const body = (await request.json()) as { email?: string };

    if (!body.email) {
      return HttpResponse.json(
        { message: "Email is required" },
        { status: 400 },
      );
    }

    // Always return 200 to avoid leaking whether an email exists
    const token = `reset-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    resetTokens.set(token, body.email);

    console.log(`[MSW] Password reset token for ${body.email}: ${token}`);

    return HttpResponse.json({
      message: "If an account with that email exists, a reset link has been sent.",
    });
  }),

  // POST /api/auth/reset-password
  http.post("/api/auth/reset-password", async ({ request }) => {
    await delay(600);

    const body = (await request.json()) as {
      token?: string;
      password?: string;
    };

    if (!body.token || !body.password) {
      return HttpResponse.json(
        { message: "Token and password are required" },
        { status: 400 },
      );
    }

    if (!resetTokens.has(body.token)) {
      return HttpResponse.json(
        { message: "Invalid or expired reset token" },
        { status: 400 },
      );
    }

    const email = resetTokens.get(body.token)!;

    // Update the user's password in the in-memory store
    const user = registeredUsers.find((u) => u.email === email);
    if (user) {
      user.password = body.password;
    }

    // Invalidate the token after use
    resetTokens.delete(body.token);

    return HttpResponse.json({
      message: "Password has been reset successfully.",
    });
  }),
];

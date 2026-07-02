import { http, HttpResponse, delay } from "msw";

// In-memory store of registered users for the mock
const registeredUsers: { email: string; fullName: string; nin: string; password: string; id: string }[] = [];

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
];

import { RequireAuth, RequireRole } from "./guards";

export function AccountPage() {
  return (
    <RequireAuth>
      <RequireRole allow={["user", "admin", "shelter"]}>
        <main className="p-8">
          <h1 className="text-2xl font-semibold">Your account</h1>
        </main>
      </RequireRole>
    </RequireAuth>
  );
}

import UnauthorizedView from "~/app/components/auth/unauthorized-view";
import LogoutButton from "~/app/components/logout-button";
import ChangePasswordForm from "~/app/components/account/change-password-form";
import { getActiveSessionAccountUser } from "~/server/auth/session";

const formatDateTime = (value: Date | null) => {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(value);
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

export default async function AccountPage() {
  const user = await getActiveSessionAccountUser();

  if (!user) return <UnauthorizedView />;

  const lastLogin = formatDateTime(user.lastLogin) ?? "Never";
  const initials = getInitials(user.name);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your profile, security, and sign-in activity.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-lg font-semibold text-white">
              {initials}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xl font-semibold text-gray-900">{user.name}</div>
                  <div className="text-sm text-gray-600">
                    {user.email ?? "No email on file"}
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    user.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <div className="text-xs uppercase text-gray-400">Last Login</div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">
                    {lastLogin}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                Keep your profile details up to date. Contact an administrator to
                update your username or email.
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="text-lg font-semibold text-gray-900">Change Password</div>
            <p className="mt-1 text-sm text-gray-600">
              Use a strong password to keep your account safe.
            </p>
            <ChangePasswordForm />
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="text-lg font-semibold text-gray-900">Sign Out</div>
            <p className="mt-1 text-sm text-gray-600">
              End your session when you are finished.
            </p>
            <div className="mt-4">
              <LogoutButton className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

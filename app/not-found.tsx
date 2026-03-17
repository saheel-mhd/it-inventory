import UnauthorizedView from "~/app/components/auth/unauthorized-view";
import { getActiveSessionStatusUser } from "~/server/auth/session";

export default async function NotFound() {
  const user = await getActiveSessionStatusUser();

  if (!user) return <UnauthorizedView />;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border surface-card p-6 text-center shadow-sm">
        <div className="text-2xl font-bold text-gray-900">404</div>
        <p className="mt-2 text-sm text-gray-600">
          The page you are looking for does not exist.
        </p>
        <a
          href="/dashboard"
          className="mt-4 inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}

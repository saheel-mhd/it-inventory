import { cookies } from "next/headers";
import { prisma } from "~/lib/prisma";

export default async function NotFound() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value;
  const user = sessionId
    ? await prisma.user.findUnique({
        where: { id: sessionId },
        select: { id: true, isActive: true },
      })
    : null;

  if (!user || !user.isActive) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-2xl border surface-card p-6 text-center shadow-sm">
          <div className="text-xl font-semibold text-gray-900">Not authorized</div>
          <p className="mt-2 text-sm text-gray-600">
            You are not authorized to view this page. Please log in to continue.
          </p>
          <a
            href="/login"
            className="mt-4 inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

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

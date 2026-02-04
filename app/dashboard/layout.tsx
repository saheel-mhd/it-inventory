import Sidebar from "~/app/components/sidebar";
import { cookies } from "next/headers";
import { prisma } from "~/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-60 min-h-screen overflow-y-auto bg-gray-50 p-6">
        {children}
      </main>
    </div>
  );
}

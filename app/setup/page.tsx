import { redirect } from "next/navigation";
import { prisma } from "~/lib/prisma";
import SetupForm from "~/app/components/auth/setup-form";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const userCount = await prisma.user.count();
  if (userCount > 0) redirect("/login");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-xl font-semibold text-gray-900">
          Welcome to CustodyHub
        </h1>
        <p className="mb-6 text-sm text-gray-600">
          No users exist yet. Create the initial admin account to begin.
        </p>
        <SetupForm />
      </div>
    </div>
  );
}

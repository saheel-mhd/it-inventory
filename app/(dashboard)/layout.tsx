import Sidebar from "~/app/components/sidebar";
import UnauthorizedView from "~/app/components/auth/unauthorized-view";
import { getActiveSessionStatusUser } from "~/server/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getActiveSessionStatusUser();

  if (!user) return <UnauthorizedView />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-60 min-h-screen overflow-y-auto bg-gray-50 p-6">
        {children}
      </main>
    </div>
  );
}

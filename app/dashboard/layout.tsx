import Sidebar from "~/app/components/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-60 min-h-screen overflow-y-auto bg-gray-50 p-6">
        {children}
      </main>
    </div>
  );
}

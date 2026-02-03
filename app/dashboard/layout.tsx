import Sidebar from "~/app/components/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr]">
      <Sidebar />
      <main className="p-6 bg-gray-50">{children}</main>
    </div>
  );
}

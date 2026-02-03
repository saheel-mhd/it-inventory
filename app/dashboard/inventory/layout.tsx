export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <header className="mb-6">
        <h1 className="text-xl font-bold">Inventory</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage items, stock, and movements.
        </p>
      </header>

      <div>{children}</div>
    </section>
  );
}

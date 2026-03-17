import Link from "next/link";

type UnauthorizedViewProps = {
  href?: string;
};

export default function UnauthorizedView({
  href = "/login",
}: UnauthorizedViewProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border surface-card p-6 text-center shadow-sm">
        <div className="text-xl font-semibold text-gray-900">Not authorized</div>
        <p className="mt-2 text-sm text-gray-600">
          You are not authorized to view this page. Please log in to continue.
        </p>
        <Link
          href={href}
          className="mt-4 inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}

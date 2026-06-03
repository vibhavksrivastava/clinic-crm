export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow text-center max-w-md">
        <h1 className="text-2xl font-bold text-red-600 mb-2">
          Access Denied
        </h1>

        <p className="text-gray-600 mb-4">
          You don’t have permission to access this page.
        </p>

        <a
          href="/login"
          className="text-blue-600 hover:underline"
        >
          Go back to login
        </a>
      </div>
    </div>
  );
}
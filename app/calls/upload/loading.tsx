export default function UploadLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 h-16" />
      <main className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <div className="h-8 w-40 bg-gray-200 animate-pulse" />
            <div className="h-4 w-72 bg-gray-100 animate-pulse mt-2" />
          </div>

          <div className="card">
            <div className="h-6 w-28 bg-gray-200 animate-pulse mb-4" />
            <div className="flex gap-4">
              <div className="flex-1 h-24 bg-gray-100 animate-pulse" />
              <div className="flex-1 h-24 bg-gray-100 animate-pulse" />
            </div>
          </div>

          <div className="card">
            <div className="h-6 w-32 bg-gray-200 animate-pulse mb-4" />
            <div className="h-64 bg-gray-100 animate-pulse" />
          </div>
        </div>
      </main>
    </div>
  );
}

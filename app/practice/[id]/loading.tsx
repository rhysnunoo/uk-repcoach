export default function PracticeSessionLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 h-16" />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <div className="h-8 w-48 bg-gray-200 animate-pulse" />
            <div className="h-4 w-72 bg-gray-100 animate-pulse mt-2" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content area */}
            <div className="lg:col-span-2 space-y-4">
              <div className="card h-96">
                <div className="h-6 w-40 bg-gray-200 animate-pulse mb-4" />
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-3 mb-3">
                    <div className="h-8 w-8 bg-gray-200 animate-pulse rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-4 w-full bg-gray-100 animate-pulse mb-1" />
                      <div className="h-4 w-2/3 bg-gray-100 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="card h-48">
                <div className="h-6 w-32 bg-gray-200 animate-pulse mb-4" />
                <div className="h-4 w-full bg-gray-100 animate-pulse mb-2" />
                <div className="h-4 w-3/4 bg-gray-100 animate-pulse mb-2" />
                <div className="h-4 w-1/2 bg-gray-100 animate-pulse" />
              </div>
              <div className="card h-32">
                <div className="h-6 w-28 bg-gray-200 animate-pulse mb-4" />
                <div className="h-10 w-full bg-gray-100 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

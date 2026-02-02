export default function CallsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 h-16" />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 w-32 bg-gray-200 animate-pulse" />
              <div className="h-4 w-48 bg-gray-100 animate-pulse mt-2" />
            </div>
            <div className="h-10 w-28 bg-gray-200 animate-pulse" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card py-3 px-4">
                <div className="h-4 w-20 bg-gray-100 animate-pulse" />
                <div className="h-8 w-16 bg-gray-200 animate-pulse mt-2" />
              </div>
            ))}
          </div>

          <div className="card">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 py-4 border-b border-gray-100">
                  <div className="h-4 w-24 bg-gray-200 animate-pulse" />
                  <div className="h-4 w-32 bg-gray-100 animate-pulse" />
                  <div className="h-4 w-16 bg-gray-100 animate-pulse" />
                  <div className="h-6 w-20 bg-gray-200 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

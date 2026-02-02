export default function CallDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 h-16" />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-6 w-20 bg-gray-200 animate-pulse" />
            <div className="h-8 w-48 bg-gray-200 animate-pulse" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="card h-32">
                <div className="flex justify-between">
                  <div>
                    <div className="h-6 w-32 bg-gray-200 animate-pulse" />
                    <div className="h-4 w-48 bg-gray-100 animate-pulse mt-2" />
                  </div>
                  <div className="h-16 w-16 bg-gray-200 animate-pulse" />
                </div>
              </div>

              <div className="card h-96">
                <div className="h-6 w-24 bg-gray-200 animate-pulse mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-4 bg-gray-100 animate-pulse" style={{ width: `${100 - i * 5}%` }} />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card h-48">
                <div className="h-6 w-28 bg-gray-200 animate-pulse mb-4" />
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex justify-between">
                      <div className="h-4 w-20 bg-gray-100 animate-pulse" />
                      <div className="h-4 w-12 bg-gray-200 animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

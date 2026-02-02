export default function ScriptsLoading() {
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
            <div className="h-10 w-32 bg-gray-200 animate-pulse" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card h-40">
                <div className="h-6 w-40 bg-gray-200 animate-pulse mb-2" />
                <div className="h-4 w-24 bg-gray-100 animate-pulse mb-4" />
                <div className="h-4 w-full bg-gray-100 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

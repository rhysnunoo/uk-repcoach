export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 h-16" />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <div className="h-8 w-32 bg-gray-200 animate-pulse" />
            <div className="h-4 w-56 bg-gray-100 animate-pulse mt-2" />
          </div>

          <div className="flex gap-4 border-b border-gray-200 pb-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-28 bg-gray-200 animate-pulse" />
            ))}
          </div>

          <div className="card">
            <div className="h-6 w-40 bg-gray-200 animate-pulse mb-6" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="h-4 w-24 bg-gray-100 animate-pulse mb-2" />
                  <div className="h-10 w-full bg-gray-200 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

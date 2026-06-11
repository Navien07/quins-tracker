export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 h-10 w-72 rounded shimmer" />
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl shimmer" />
        ))}
      </div>
      <div className="mb-8 h-64 rounded-xl shimmer" />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-44 rounded-xl shimmer" />
        ))}
      </div>
    </main>
  )
}

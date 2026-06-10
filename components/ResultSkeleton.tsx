export function ResultSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading verification result">
      <div className="skeleton h-[88px] w-full rounded-lg" />
      <div className="skeleton h-[52px] w-full" />
      <div className="card overflow-hidden">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`p-4 ${i < 4 ? 'border-b border-[#E2E8F0]' : ''} flex gap-3`}
          >
            <div className="skeleton h-5 w-5 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3.5 w-1/3" />
              <div className="skeleton h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

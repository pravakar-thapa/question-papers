function Skeleton() {
  return (
    <div className="card-surface flex min-h-[240px] flex-col p-5 animate-pulse">
      {/* Header */}
      <div className="mb-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-1"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
      </div>

      {/* Metadata */}
      <div className="mb-4 space-y-1">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-lg w-20"></div>
        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-lg w-16"></div>
        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-lg w-20"></div>
        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-lg w-24"></div>
      </div>
    </div>
  );
}

export default Skeleton;

import { motion } from "framer-motion";
import {
  ArrowDownRight,
  Bookmark,
  UploadCloud,
  LayoutGrid,
} from "lucide-react";
import FilterBar from "../components/FilterBar";
import PDFCard from "../components/cards/PDFCard";
import EmptyState from "../components/ui/EmptyState";
import Skeleton from "../components/ui/Skeleton";

function Home({
  loading,
  pdfs,
  savedPdfs,
  myUploads,
  showSaved,
  showUploads,
  setShowSaved,
  setShowUploads,
  fetchSavedPdfs,
  onSavedChange,
  fetchMyUploads,
  filters,
  setFilters,
  userRole,
  isLoggedIn,
  fetchPDFs,
  page,
  setPage,
  pagination,
}) {
  const activeList = showUploads ? myUploads : showSaved ? savedPdfs : pdfs;
  const savedPdfIds = new Set(savedPdfs.map((pdf) => pdf._id));
  const quickActionClass = (isActive) =>
    isActive ? "btn-primary" : "btn-secondary";
  const activeLabel = showUploads
    ? "My uploads"
    : showSaved
      ? "Saved papers"
      : "All question papers";

  return (
    <div className="space-y-6 sm:space-y-8">
      {!isLoggedIn && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-lg bg-gradient-to-r from-slate-900 via-indigo-600 to-cyan-600 p-6 text-white shadow-sm sm:p-8 lg:p-10"
        >
          <div className="max-w-4xl space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100 sm:px-4">
              <ArrowDownRight className="w-4 h-4" />
              Modern Study Archive
            </span>
            <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
              Find the best question papers, fast.
            </h1>
            <p className="max-w-2xl text-base text-slate-100/85 sm:text-lg">
              Search, save, upload and manage exam papers with a polished
              interface designed for students, admins, and study groups.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-white/10 border border-white/20 p-4 backdrop-blur-sm">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-200">
                  Total papers
                </p>
                <p className="mt-4 text-3xl font-semibold">
                  {pagination.total}
                </p>
              </div>
              <div className="rounded-lg bg-white/10 border border-white/20 p-4 backdrop-blur-sm">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-200">
                  Saved
                </p>
                <p className="mt-4 text-3xl font-semibold">
                  {savedPdfs.length}
                </p>
              </div>
              <div className="rounded-lg bg-white/10 border border-white/20 p-4 backdrop-blur-sm">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-200">
                  Your uploads
                </p>
                <p className="mt-4 text-3xl font-semibold">
                  {myUploads.length}
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {!isLoggedIn && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="card-surface p-5">
            <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-300 mb-4">
              <LayoutGrid className="w-6 h-6" />
              <div>
                <p className="text-sm uppercase tracking-[0.2em]">Browse</p>
                <p className="font-semibold text-lg">{activeLabel}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              View the latest uploads and keep your library organized with fast
              filtering.
            </p>
          </div>

          <div className="card-surface p-5">
            <div className="flex items-center gap-3 text-emerald-600 mb-4">
              <Bookmark className="w-6 h-6" />
              <div>
                <p className="text-sm uppercase tracking-[0.2em]">
                  Collections
                </p>
                <p className="font-semibold text-lg">Saved papers</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Keep track of your top study resources and revisit them whenever
              you need.
            </p>
          </div>

          <div className="card-surface p-5">
            <div className="flex items-center gap-3 text-sky-600 mb-4">
              <UploadCloud className="w-6 h-6" />
              <div>
                <p className="text-sm uppercase tracking-[0.2em]">Share</p>
                <p className="font-semibold text-lg">Upload resources</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Contribute your own question papers in seconds and help build the
              community archive.
            </p>
          </div>
        </div>
      )}

      {!isLoggedIn && (
      <div className="card-surface p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="eyebrow">
              Quick actions
            </p>
            <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
              Jump into your library
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap">
            <button
              type="button"
              onClick={() => {
                setShowSaved(false);
                setShowUploads(false);
              }}
              className={quickActionClass(!showSaved && !showUploads)}
            >
              All Papers
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!localStorage.getItem("token")) {
                  window.alert("Please login to view saved papers.");
                  return;
                }
                setShowSaved(true);
                setShowUploads(false);
                await fetchSavedPdfs();
              }}
              className={quickActionClass(showSaved)}
            >
              Saved Papers
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!localStorage.getItem("token")) {
                  window.alert("Please login to view uploads.");
                  return;
                }
                setShowUploads(true);
                setShowSaved(false);
                await fetchMyUploads();
              }}
              className={quickActionClass(showUploads)}
            >
              My Uploads
            </button>
          </div>
        </div>
      </div>
      )}

      <FilterBar filters={filters} setFilters={setFilters} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} />)
        ) : activeList.length === 0 ? (
          <EmptyState
            message={
              showSaved
                ? "No saved papers yet"
                : showUploads
                  ? "No uploads yet"
                  : "No papers matched your filters"
            }
            submessage={
              showSaved
                ? "Save a useful paper to find it again instantly."
                : showUploads
                  ? "Upload your first question paper to publish it."
                  : "Try adjusting filters or upload new content."
            }
          />
        ) : (
          activeList.map((pdf) => (
            <PDFCard
              key={pdf._id}
              pdf={pdf}
              showDeleteButton={userRole === "admin" && isLoggedIn && !showUploads}
              refresh={showUploads ? fetchMyUploads : fetchPDFs}
              showStatus={showUploads}
              showOwnerControls={showUploads}
              isSaved={savedPdfIds.has(pdf._id)}
              onSavedChange={onSavedChange}
            />
          ))
        )}
      </div>

      {!showSaved && !showUploads && pagination?.pages > 1 && (
        <div className="mt-6 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            Previous
          </button>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Page {pagination.page} of {pagination.pages} · {pagination.total}{" "}
            PDFs
          </p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setPage(Math.min(pagination.pages, page + 1))}
            disabled={page >= pagination.pages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default Home;

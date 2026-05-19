import { useEffect, useState } from "react";
import useDebounce from "../utils/useDebounce";
import { API_BASE_URL } from "../constants/api";
import { Search, Filter, X, Archive } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

function FilterBar({ filters, setFilters }) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [isExpanded, setIsExpanded] = useState(false);
  const debouncedFilters = useDebounce(localFilters, 400);

  useEffect(() => {
    setFilters(debouncedFilters);
  }, [debouncedFilters, setFilters]);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters({ ...localFilters, [name]: value });
  };

  const handleDownloadAll = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Please login to download PDFs as ZIP");
      return;
    }

    const hasFilters =
      filters.title ||
      filters.college ||
      filters.course ||
      filters.semester ||
      filters.year;

    if (!hasFilters) {
      toast.error("Use filters to download PDFs as ZIP");
      return;
    }

    const params = new URLSearchParams();
    if (filters.title) params.set("title", filters.title);
    if (filters.college) params.set("college", filters.college);
    if (filters.course) params.set("course", filters.course);
    if (filters.semester) params.set("semester", filters.semester);
    if (filters.year) params.set("year", filters.year);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/download-all?${queryString}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const message = await response.text();
        toast.error(message || "ZIP download failed");
        return;
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "pdfs.zip";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Downloading ZIP file...");
    } catch (err) {
      console.error(err);
      toast.error("ZIP download failed");
    }
  };

  const clearFilters = () => {
    setLocalFilters({
      title: "",
      college: "",
      course: "",
      semester: "",
      year: "",
      sort: "",
    });
    toast.success("Filters cleared");
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== "");

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-surface mb-6 p-4 sm:p-5"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Filter className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="truncate text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
            Filter PDFs
          </h3>
          {hasActiveFilters && (
            <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full text-xs font-medium">
              Active
            </span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="rounded-lg bg-gray-100 p-2 transition-colors hover:bg-gray-200 md:hidden dark:bg-gray-700 dark:hover:bg-gray-600"
          aria-label="Toggle filters"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      <div
        className={`grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 ${isExpanded ? "block" : "hidden md:grid"}`}
      >
        <div className="relative">
          <input
            className="input-primary w-full pl-10"
            name="title"
            placeholder="Search by title..."
            value={localFilters.title}
            onChange={handleChange}
          />
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
        </div>

        <input
          className="input-primary w-full"
          name="college"
          placeholder="College"
          value={localFilters.college}
          onChange={handleChange}
        />

        <input
          className="input-primary w-full"
          name="course"
          placeholder="Course"
          value={localFilters.course}
          onChange={handleChange}
        />

        <input
          className="input-primary w-full"
          name="semester"
          placeholder="Semester"
          value={localFilters.semester}
          onChange={handleChange}
        />

        <input
          className="input-primary w-full"
          name="year"
          placeholder="Year"
          value={localFilters.year}
          onChange={handleChange}
        />

        <select
          name="sort"
          value={localFilters.sort}
          onChange={handleChange}
          className="input-primary w-full"
        >
          <option value="">Latest</option>
          <option value="popular">Most Downloaded</option>
        </select>
      </div>

      {/* Action Buttons */}
      <div className="action-row mt-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={clearFilters}
          disabled={!hasActiveFilters}
          className="btn-secondary w-full sm:w-auto"
        >
          <X className="w-4 h-4" />
          Clear Filters
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleDownloadAll}
          className="success-button w-full sm:w-auto"
          title="Download all filtered PDFs as a ZIP file"
        >
          <Archive className="w-4 h-4" />
          Download ZIP
        </motion.button>
      </div>
    </motion.div>
  );
}

export default FilterBar;

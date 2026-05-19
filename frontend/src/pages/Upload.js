import { apiRequest } from "../utils/apiRequest";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

function UploadPanel({ refresh, isUploaderAdmin = false }) {
  const [formData, setFormData] = useState({
    title: "",
    college: "",
    course: "",
    semester: "",
    year: "",
    file: null,
  });
  const fileInputRef = useRef();
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "file") {
      setFormData({ ...formData, file: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      data.append(key === "file" ? "pdf" : key, formData[key]);
    });

    try {
      const response = await apiRequest("/upload", {
        method: "POST",
        body: data,
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Session expired. Please login again.");
          localStorage.removeItem("token");
          window.location.reload();
        } else {
          toast.error(response.message || "Upload failed");
        }
        setLoading(false);
        return;
      }

      const duplicateSourceStatus = response.data?.data?.duplicateSourceStatus;
      const duplicateMessage = duplicateSourceStatus
        ? ` Duplicate present in ${duplicateSourceStatus}.`
        : "";

      toast.success(
        isUploaderAdmin && !duplicateSourceStatus
          ? "PDF uploaded successfully!"
          : `PDF uploaded successfully! Pending admin review.${duplicateMessage}`,
      );

      refresh();
      setFormData({
        title: "",
        college: "",
        course: "",
        semester: "",
        year: "",
        file: null,
      });
      fileInputRef.current.value = "";
    } catch (err) {
      console.error(err);
      toast.error("Upload error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-surface mb-8 p-4 sm:p-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <p className="eyebrow">Upload paper</p>
          <h2 className="mt-3 text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">Share a question paper with your community</h2>
          <p className="muted-text mt-2 max-w-xl">
            {isUploaderAdmin
              ? "Your PDF is published immediately for everyone once upload completes."
              : "Your submission will be reviewed by admins before it appears in the public library."}
          </p>
        </div>
      </div>

      <form className="grid gap-3 md:grid-cols-2" onSubmit={handleUpload}>
        <input
          name="title"
          placeholder="Title"
          value={formData.title}
          onChange={handleChange}
          className="input-primary"
          required
        />
        <input
          name="college"
          placeholder="College"
          value={formData.college}
          onChange={handleChange}
          className="input-primary"
          required
        />
        <input
          name="course"
          placeholder="Course"
          value={formData.course}
          onChange={handleChange}
          className="input-primary"
          required
        />
        <input
          name="semester"
          placeholder="Semester"
          value={formData.semester}
          onChange={handleChange}
          className="input-primary"
          required
        />
        <input
          name="year"
          type="number"
          placeholder="Year"
          value={formData.year}
          onChange={handleChange}
          className="input-primary"
          required
        />
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">PDF File</span>
          <input
            ref={fileInputRef}
            name="file"
            type="file"
            accept="application/pdf"
            onChange={handleChange}
            className="mt-2 block w-full text-sm text-gray-700 dark:text-gray-200 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 dark:file:bg-indigo-800 dark:file:text-indigo-200"
            required
          />
        </label>
        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full md:w-auto"
          >
            {loading ? "Uploading..." : "Upload PDF"}
          </button>
        </div>
      </form>
    </motion.section>
  );
}

export default UploadPanel;

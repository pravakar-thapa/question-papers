import { API_BASE_URL } from "../../constants/api";
import { useEffect, useState } from "react";
import {
  Download,
  Eye,
  Star,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Reply,
  Save,
  Crown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

function PDFCard({
  pdf,
  refresh,
  showDeleteButton,
  showStatus,
  showOwnerControls,
  isSaved = false,
  onSavedChange,
}) {
  const [saved, setSaved] = useState(isSaved);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState(
    Array.isArray(pdf.comments) ? pdf.comments : [],
  );
  const [sortType, setSortType] = useState("newest");
  const [replyTexts, setReplyTexts] = useState({});
  const [showComments, setShowComments] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState("");
  const [collapsedComments, setCollapsedComments] = useState([]);
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [correctionLoading, setCorrectionLoading] = useState(false);
  const [correctionData, setCorrectionData] = useState({
    title: pdf.title || "",
    college: pdf.college || "",
    course: pdf.course || "",
    semester: pdf.semester || "",
    year: pdf.year || "",
    file: null,
  });

  const token = localStorage.getItem("token");
  const canEditAndResubmit =
    showOwnerControls && ["approved", "rejected"].includes(pdf.status);
  const canInlineEdit = showOwnerControls && pdf.status === "pending";

  useEffect(() => {
    setSaved(isSaved);
  }, [isSaved]);

  useEffect(() => {
    setCorrectionData({
      title: pdf.title || "",
      college: pdf.college || "",
      course: pdf.course || "",
      semester: pdf.semester || "",
      year: pdf.year || "",
      file: null,
    });
    setShowCorrectionForm(false);
  }, [pdf]);

  let currentUser = null;

  if (token) {
    try {
      currentUser = JSON.parse(atob(token.split(".")[1]));
    } catch (err) {
      console.error(err);
    }
  }

  const handleDelete = async () => {
    const reason = window.prompt("Why are you deleting this PDF?");

    if (reason === null) return;

    if (!reason.trim()) {
      toast.error("Deletion reason is required");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/pdf/${pdf._id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reviewComment: reason.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Delete failed");
        return;
      }

      toast.success("PDF removed from your uploads");
      refresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete PDF");
    }
  };

  const handleSave = async () => {
    if (!token) {
      toast.error("Please login to save PDFs");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/save/${pdf._id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      const nextSaved = data?.data?.saved ?? data?.saved;

      if (!res.ok || typeof nextSaved !== "boolean") {
        toast.error(data?.message || "Save failed");
        return;
      }

      setSaved(nextSaved);
      onSavedChange?.(pdf, nextSaved);
      toast.success(nextSaved ? "PDF saved!" : "PDF unsaved");
    } catch (err) {
      console.error(err);
      toast.error("Save failed");
    }
  };

  const handleCorrectionChange = (event) => {
    const { name, value, files } = event.target;
    setCorrectionData((current) => ({
      ...current,
      [name]: name === "file" ? files?.[0] || null : value,
    }));
  };

  const handleCorrectionSubmit = async (event) => {
    event.preventDefault();
    setCorrectionLoading(true);

    const data = new FormData();
    ["title", "college", "course", "semester", "year"].forEach((field) => {
      data.append(field, correctionData[field]);
    });
    if (correctionData.file) {
      data.append("pdf", correctionData.file);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/pdf/${pdf._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      });
      const responseData = await res.json();

      if (!res.ok) {
        toast.error(responseData.message || "Resubmit failed");
        return;
      }

      toast.success("PDF edited and sent for admin review.");
      setShowCorrectionForm(false);
      refresh();
    } catch (err) {
      console.error(err);
      toast.error("Resubmit failed");
    } finally {
      setCorrectionLoading(false);
    }
  };

  const handleComment = async () => {
    if (!token) {
      toast.error("Please login to comment");
      return;
    }

    if (!comment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      const optimisticComment = {
        text: comment,
        username: currentUser.username,
        createdAt: new Date(),
        replies: [],
        likes: 0,
        dislikes: 0,
      };

      setComments([optimisticComment, ...comments]);
      setComment("");

      const res = await fetch(`${API_BASE_URL}/pdf/${pdf._id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: comment }),
      });

      const data = await res.json();
      setComments(Array.isArray(data.comments) ? data.comments : []);
      toast.success("Comment added!");
    } catch (err) {
      console.error(err);
      toast.error("Comment failed");
    }
  };

  const handleLike = async (index) => {
    if (!token) {
      toast.error("Please login first");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/pdf/${pdf._id}/comment/${index}/like`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Like failed");
        return;
      }

      setComments(Array.isArray(data.comments) ? data.comments : []);
    } catch (err) {
      console.error(err);
      toast.error("Like failed");
    }
  };

  const handleDislike = async (index) => {
    if (!token) {
      toast.error("Please login first");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/pdf/${pdf._id}/comment/${index}/dislike`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Dislike failed");
        return;
      }

      setComments(Array.isArray(data.comments) ? data.comments : []);
    } catch (err) {
      console.error(err);
      toast.error("Dislike failed");
    }
  };

  const handleEditComment = async (index) => {
    if (!editText.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/pdf/${pdf._id}/comment/${index}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: editText }),
        },
      );

      const data = await res.json();
      setComments(Array.isArray(data.comments) ? data.comments : []);
      setEditingIndex(null);
      toast.success("Comment updated!");
    } catch (err) {
      console.error(err);
      toast.error("Edit failed");
    }
  };

  const handleDeleteComment = async (index) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/pdf/${pdf._id}/comment/${index}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();
      setComments(Array.isArray(data.comments) ? data.comments : []);
      toast.success("Comment deleted!");
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  const handleReply = async (index) => {
    if (!token) {
      toast.error("Please login first");
      return;
    }

    if (!replyTexts[index]?.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }

    try {
      const optimisticReply = {
        text: replyTexts[index],
        username: currentUser.username,
        createdAt: new Date(),
        replies: [],
      };

      const updatedComments = [...comments];
      if (!updatedComments[index].replies) {
        updatedComments[index].replies = [];
      }
      updatedComments[index].replies.unshift(optimisticReply);
      setComments(updatedComments);

      const res = await fetch(
        `${API_BASE_URL}/pdf/${pdf._id}/comment/${index}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: replyTexts[index] }),
        },
      );

      const data = await res.json();
      setComments(Array.isArray(data.comments) ? data.comments : []);
      setReplyTexts({ ...replyTexts, [index]: "" });
      toast.success("Reply added!");
    } catch (err) {
      console.error(err);
      toast.error("Reply failed");
    }
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (sortType === "newest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (sortType === "top") {
      return (b.likes || 0) - (a.likes || 0);
    }
    return 0;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card-surface flex min-h-[260px] flex-col p-5 transition-shadow duration-300 hover:shadow-md"
    >
      {/* Header */}
      <div className="mb-4">
        <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-gray-900 dark:text-white">
          {pdf.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-1">
          {pdf.college}
        </p>
        {showStatus && pdf.status && (
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                pdf.status === "approved"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : pdf.status === "pending"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    : pdf.status === "deleted"
                      ? "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}
            >
              {pdf.status}
            </span>
            {pdf.editedAfterReview && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                edited
              </span>
            )}
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="mb-4 space-y-1 text-sm text-gray-500 dark:text-gray-400">
        <p>
          {pdf.course} | Sem {pdf.semester} | {pdf.year}
        </p>
        <p className="flex items-center gap-1">
          <Download className="w-4 h-4" />
          {pdf.downloads || 0} downloads
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {showDeleteButton && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDelete}
            className="danger-button"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
            saved
              ? "bg-yellow-500 hover:bg-yellow-600 text-white shadow-md shadow-yellow-500/25"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
          }`}
        >
          <Star className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
          {saved ? "Saved" : "Save"}
        </motion.button>

        <motion.a
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          href={`${API_BASE_URL}/download/${pdf._id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="success-button"
        >
          <Download className="w-4 h-4" />
          Download
        </motion.a>

        {showOwnerControls && (
          <>
            {canEditAndResubmit && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCorrectionForm((showing) => !showing)}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
              >
                <Edit className="w-4 h-4" />
                Edit & Resubmit
              </motion.button>
            )}

            {canInlineEdit && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={async () => {
                  const newTitle = prompt("Edit title", pdf.title);
                  const newCollege = prompt("Edit college", pdf.college);
                  const newCourse = prompt("Edit course", pdf.course);
                  const newSemester = prompt("Edit semester", pdf.semester);
                  const newYear = prompt("Edit year", pdf.year);

                  if (!newTitle) return;

                  try {
                    await fetch(`${API_BASE_URL}/pdf/${pdf._id}`, {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                      },
                      body: JSON.stringify({
                        title: newTitle,
                        college: newCollege,
                        course: newCourse,
                        semester: newSemester,
                        year: newYear,
                      }),
                    });
                    toast.success("PDF updated!");
                    refresh();
                  } catch (err) {
                    console.error(err);
                    toast.error("Update failed");
                  }
                }}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
              >
                <Edit className="w-4 h-4" />
                Edit
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDelete}
              className="danger-button"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </motion.button>
          </>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            const previewUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdf.url)}`;
            window.open(previewUrl, "_blank");
          }}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-violet-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-600"
        >
          <Eye className="w-4 h-4" />
          Preview
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowComments(!showComments)}
          className="btn-primary"
        >
          <MessageCircle className="w-4 h-4" />
          Comments ({comments.length})
        </motion.button>
      </div>

      {showOwnerControls && pdf.status === "rejected" && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100">
          <p className="font-semibold">Rejected by admin</p>
          <p className="mt-1">{pdf.reviewComment || "No reason provided."}</p>
        </div>
      )}

      {canEditAndResubmit && showCorrectionForm && (
        <form
          onSubmit={handleCorrectionSubmit}
          className="mb-4 grid gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30"
        >
          <input
            name="title"
            value={correctionData.title}
            onChange={handleCorrectionChange}
            className="input-primary"
            placeholder="Title"
            required
          />
          <input
            name="college"
            value={correctionData.college}
            onChange={handleCorrectionChange}
            className="input-primary"
            placeholder="College"
            required
          />
          <input
            name="course"
            value={correctionData.course}
            onChange={handleCorrectionChange}
            className="input-primary"
            placeholder="Course"
            required
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="semester"
              value={correctionData.semester}
              onChange={handleCorrectionChange}
              className="input-primary"
              placeholder="Semester"
              required
            />
            <input
              name="year"
              type="number"
              value={correctionData.year}
              onChange={handleCorrectionChange}
              className="input-primary"
              placeholder="Year"
              required
            />
          </div>
          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Replace PDF file, optional
            </span>
            <input
              name="file"
              type="file"
              accept="application/pdf"
              onChange={handleCorrectionChange}
              className="mt-2 block w-full text-sm text-gray-700 dark:text-gray-200 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-amber-800 dark:file:bg-amber-900 dark:file:text-amber-100"
            />
          </label>
          <div className="action-row justify-end">
            <button
              type="button"
              onClick={() => setShowCorrectionForm(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={correctionLoading}
              className="btn-primary"
            >
              {correctionLoading ? "Submitting..." : "Submit for Review"}
            </button>
          </div>
        </form>
      )}

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200 dark:border-gray-600 pt-4"
          >
            {/* Comment Input */}
            <div className="mb-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="input-primary flex-1"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleComment}
                  className="btn-primary"
                >
                  Comment
                </motion.button>
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="mb-4">
              <select
                value={sortType}
                onChange={(e) => setSortType(e.target.value)}
                className="input-primary"
              >
                <option value="newest">Newest</option>
                <option value="top">Top</option>
              </select>
            </div>

            {/* Comments List */}
            <div className="space-y-3">
              {Array.isArray(sortedComments) &&
                sortedComments.map((c, sortedIndex) => {
                  const originalIndex = comments.findIndex(
                    (comment) => comment._id === c._id,
                  );
                  const hasLiked =
                    currentUser && c.likedBy?.includes(currentUser.userId);
                  const hasDisliked =
                    currentUser && c.dislikedBy?.includes(currentUser.userId);

                  return (
                    <motion.div
                      key={c._id || sortedIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: sortedIndex * 0.1 }}
                      className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700"
                    >
                      {/* Comment Header */}
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {c.username}
                          </span>
                          {c.role === "admin" && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-xs font-medium">
                              <Crown className="w-3 h-3" />
                              Admin
                            </span>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(c.createdAt).toLocaleString()}
                          </span>
                          {c.edited && (
                            <span className="text-xs text-orange-500">
                              (edited)
                            </span>
                          )}
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          onClick={() => {
                            if (collapsedComments.includes(originalIndex)) {
                              setCollapsedComments(
                                collapsedComments.filter(
                                  (i) => i !== originalIndex,
                                ),
                              );
                            } else {
                              setCollapsedComments([
                                ...collapsedComments,
                                originalIndex,
                              ]);
                            }
                          }}
                          className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {collapsedComments.includes(originalIndex) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronUp className="w-4 h-4" />
                          )}
                        </motion.button>
                      </div>

                      {/* Comment Text */}
                      <p className="text-gray-700 dark:text-gray-300 mb-3 break-words">
                        {c.text}
                      </p>

                      {!collapsedComments.includes(originalIndex) && (
                        <>
                          {/* Like/Dislike Buttons */}
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleLike(originalIndex)}
                              className={`inline-flex items-center gap-1 rounded px-2 py-1 text-sm font-medium transition-colors ${
                                hasLiked
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200"
                              }`}
                            >
                              <ThumbsUp className="w-4 h-4" />
                              {c.likes || 0}
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDislike(originalIndex)}
                              className={`inline-flex items-center gap-1 rounded px-2 py-1 text-sm font-medium transition-colors ${
                                hasDisliked
                                  ? "bg-red-500 text-white"
                                  : "bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200"
                              }`}
                            >
                              <ThumbsDown className="w-4 h-4" />
                              {c.dislikes || 0}
                            </motion.button>
                          </div>

                          {/* Edit/Delete Buttons */}
                          {currentUser &&
                            String(c.userId) === String(currentUser.userId) && (
                              <div className="mb-3 flex flex-wrap gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  onClick={() => {
                                    setEditingIndex(originalIndex);
                                    setEditText(c.text);
                                  }}
                                  className="inline-flex items-center gap-1 rounded bg-blue-500 px-2 py-1 text-sm font-medium text-white transition-colors hover:bg-blue-600"
                                >
                                  <Edit className="w-3 h-3" />
                                  Edit
                                </motion.button>

                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  onClick={() =>
                                    handleDeleteComment(originalIndex)
                                  }
                                  className="inline-flex items-center gap-1 rounded bg-red-500 px-2 py-1 text-sm font-medium text-white transition-colors hover:bg-red-600"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Delete
                                </motion.button>
                              </div>
                            )}

                          {/* Edit Form */}
                          {editingIndex === originalIndex && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mb-3"
                            >
                              <div className="flex flex-col gap-2 sm:flex-row">
                                <input
                                  type="text"
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="input-primary flex-1"
                                />
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() =>
                                    handleEditComment(originalIndex)
                                  }
                                  className="success-button"
                                >
                                  <Save className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </motion.div>
                          )}

                          {/* Reply Input */}
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <input
                              type="text"
                              placeholder="Reply..."
                              value={replyTexts[originalIndex] || ""}
                              onChange={(e) =>
                                setReplyTexts({
                                  ...replyTexts,
                                  [originalIndex]: e.target.value,
                                })
                              }
                              className="input-primary flex-1"
                            />
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleReply(originalIndex)}
                              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-teal-500 px-3 py-2 font-semibold text-white transition-colors hover:bg-teal-600"
                            >
                              <Reply className="w-4 h-4" />
                            </motion.button>
                          </div>

                          {/* Replies */}
                          {c.replies?.map((reply, i) => (
                            <div
                              key={i}
                              className="mt-3 rounded-lg border-l-4 border-teal-500 bg-white p-3 dark:bg-gray-600 sm:ml-6"
                            >
                              <div className="mb-1 flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                  {reply.username}
                                </span>
                                {reply.role === "admin" && (
                                  <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-xs font-medium">
                                    <Crown className="w-2 h-2" />
                                    Admin
                                  </span>
                                )}
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(reply.createdAt).toLocaleString()}
                                </span>
                                {reply.edited && (
                                  <span className="text-xs text-orange-500">
                                    (edited)
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 text-sm break-words">
                                {reply.text}
                              </p>
                            </div>
                          ))}
                        </>
                      )}
                    </motion.div>
                  );
                })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default PDFCard;

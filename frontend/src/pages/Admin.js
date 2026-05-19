import { API_BASE_URL } from "../constants/api";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Trash2,
  Eye,
  FileText,
  RotateCcw,
  History,
  UserCog,
  ShieldCheck,
  Ban,
  KeyRound,
  UserX,
} from "lucide-react";
import EmptyState from "../components/ui/EmptyState";
import toast from "react-hot-toast";

function AdminPanel({ refresh }) {
  const [pendingPdfs, setPendingPdfs] = useState([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [allPdfs, setAllPdfs] = useState([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewComment, setReviewComment] = useState("");
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(true);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userActionId, setUserActionId] = useState(null);

  const authHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const currentUserId = (() => {
    try {
      const token = localStorage.getItem("token");
      return token ? JSON.parse(atob(token.split(".")[1])).userId : "";
    } catch {
      return "";
    }
  })();

  const readApiResponse = async (res) => {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return res.json();
    }

    const text = await res.text();
    return {
      message:
        text.match(/<pre>(.*?)<\/pre>/s)?.[1] ||
        text ||
        "Backend returned a non-JSON response.",
    };
  };

  const statusClass = (status) => {
    if (status === "approved") {
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    }
    if (status === "pending") {
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    }
    if (status === "deleted") {
      return "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  };

  const uploaderName = (pdf) =>
    pdf.submittedBy?.username || pdf.submittedByName || "Unknown";

  const uploaderRole = (pdf) => pdf.submittedBy?.role || "user";

  const deletedByName = (pdf) =>
    pdf.reviewedBy?.username || pdf.deletedByName || "Unknown";

  const deletedByRole = (pdf) =>
    pdf.reviewedBy?.role || pdf.deletedByRole || "user";

  const roleClass = (role) =>
    role === "admin"
      ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
      : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200";

  const duplicateLabel = (pdf) => {
    if (!pdf.duplicateOf && !pdf.duplicateSourceStatus) return "";
    const rawStatus =
      pdf.duplicateSourceStatus || pdf.duplicateOf?.status || "full library";
    const status =
      rawStatus === "pending" ? "pending" : "full library";
    const name = pdf.duplicateSourceSubmittedByName || "Unknown";
    const role = pdf.duplicateSourceSubmittedByRole || "user";
    const duplicateDeletedByName =
      pdf.duplicateSourceDeletedByName || pdf.duplicateOf?.reviewedBy?.username;
    const duplicateDeletedByRole =
      pdf.duplicateSourceDeletedByRole || pdf.duplicateOf?.reviewedBy?.role;
    const deletedBy =
      duplicateDeletedByName && status === "full library"
        ? ` Deleted by ${duplicateDeletedByName} (${duplicateDeletedByRole || "user"}).`
        : "";
    return `Duplicate present in ${status}, uploaded by ${name} (${role}).${deletedBy}`;
  };

  const fetchAllPdfs = useCallback(async () => {
    try {
      setLoadingAll(true);
      const res = await fetch(`${API_BASE_URL}/admin/all-pdfs`, {
        headers: authHeader(),
      });
      const data = await res.json();
      const pdfs = data?.data?.pdfs ?? data;
      if (Array.isArray(pdfs)) {
        setAllPdfs(pdfs);
        setSelectedIds(new Set());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAll(false);
    }
  }, []);

  const fetchPendingPdfs = useCallback(async () => {
    try {
      setLoadingPending(true);
      const res = await fetch(`${API_BASE_URL}/pending-pdfs`, {
        headers: authHeader(),
      });
      const data = await res.json();
      const pendingPdfs = data?.data?.pendingPdfs ?? data;
      if (Array.isArray(pendingPdfs)) {
        setPendingPdfs(pendingPdfs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPending(false);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoadingAudit(true);
      const res = await fetch(`${API_BASE_URL}/admin/audit-logs?limit=8`, {
        headers: authHeader(),
      });
      const data = await res.json();
      const logs = data?.data?.logs ?? [];
      if (Array.isArray(logs)) {
        setAuditLogs(logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAudit(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: authHeader(),
      });
      const data = await readApiResponse(res);
      if (!res.ok) {
        toast.error(data.message || "Users fetch failed.");
        setUsers([]);
        return;
      }
      const users = data?.data?.users ?? [];
      if (Array.isArray(users)) {
        setUsers(users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingPdfs();
    fetchAllPdfs();
    fetchAuditLogs();
    fetchUsers();
  }, [fetchAllPdfs, fetchPendingPdfs, fetchAuditLogs, fetchUsers]);

  const handleReview = async (pdfId, status) => {
    if (status === "rejected" && !reviewComment.trim()) {
      toast.error("Please add a rejection reason.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/pdf/${pdfId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          status,
          reviewComment: reviewComment.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.message || "Review failed.");
        return;
      }

      toast.success(`PDF ${status} successfully`);
      setReviewingId(null);
      setReviewComment("");
      fetchPendingPdfs();
      fetchAllPdfs();
      fetchAuditLogs();
      refresh();
    } catch (err) {
      console.error(err);
      toast.error("Review error");
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const key = String(id);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const allSelected =
    allPdfs.length > 0 && allPdfs.every((p) => selectedIds.has(String(p._id)));

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allPdfs.map((p) => String(p._id))));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      toast.error("Select at least one PDF to delete.");
      return;
    }

    if (!window.confirm(`Permanently delete ${selectedIds.size} PDF(s)?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/pdf/bulk-delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify({ ids: [...selectedIds] }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Bulk delete failed.");
        return;
      }
      toast.success(data.message || "Selected PDFs deleted.");
      setSelectedIds(new Set());
      fetchPendingPdfs();
      fetchAllPdfs();
      fetchAuditLogs();
      refresh();
    } catch (e) {
      console.error(e);
      toast.error("Bulk delete error.");
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Permanently delete every PDF? This cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/pdf/all`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify({ permanent: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Delete all failed.");
        return;
      }
      toast.success(data.message || "All PDFs deleted.");
      setSelectedIds(new Set());
      fetchPendingPdfs();
      fetchAllPdfs();
      fetchAuditLogs();
      refresh();
    } catch (e) {
      console.error(e);
      toast.error("Delete all error.");
    }
  };

  const handleRestore = async (pdf) => {
    const reason = window.prompt("Restore note", "Restored by admin");
    if (reason === null) return;

    try {
      const res = await fetch(`${API_BASE_URL}/pdf/${pdf._id}/restore`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify({ reviewComment: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Restore failed.");
        return;
      }
      toast.success("PDF restored.");
      fetchPendingPdfs();
      fetchAllPdfs();
      fetchAuditLogs();
      refresh();
    } catch (err) {
      console.error(err);
      toast.error("Restore failed.");
    }
  };

  const updateUserRole = async (user, role) => {
    try {
      setUserActionId(user._id);
      const res = await fetch(`${API_BASE_URL}/admin/users/${user._id}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Role update failed.");
        return;
      }
      toast.success(role === "admin" ? "User promoted." : "User demoted.");
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error("Role update failed.");
    } finally {
      setUserActionId(null);
    }
  };

  const updateUserBan = async (user, isBanned) => {
    const reason = isBanned
      ? window.prompt("Reason for ban")
      : "Unbanned by admin";
    if (reason === null) return;
    if (isBanned && !reason.trim()) {
      toast.error("Ban reason is required.");
      return;
    }

    try {
      setUserActionId(user._id);
      const res = await fetch(`${API_BASE_URL}/admin/users/${user._id}/ban`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify({ isBanned, reason: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "User update failed.");
        return;
      }
      toast.success(isBanned ? "User banned." : "User unbanned.");
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error("User update failed.");
    } finally {
      setUserActionId(null);
    }
  };

  const resetUserPassword = async (user) => {
    const newPassword = window.prompt(`New password for ${user.username}`);
    if (newPassword === null) return;
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    try {
      setUserActionId(user._id);
      const res = await fetch(`${API_BASE_URL}/admin/users/${user._id}/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Password reset failed.");
        return;
      }
      toast.success("Password reset.");
    } catch (err) {
      console.error(err);
      toast.error("Password reset failed.");
    } finally {
      setUserActionId(null);
    }
  };

  const deleteUser = async (user) => {
    if (
      !window.confirm(
        `Delete ${user.username}? This removes the user account immediately.`,
      )
    ) {
      return;
    }

    try {
      setUserActionId(user._id);
      const res = await fetch(`${API_BASE_URL}/admin/users/${user._id}`, {
        method: "DELETE",
        headers: authHeader(),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "User delete failed.");
        return;
      }
      toast.success("User deleted.");
      fetchUsers();
      fetchAllPdfs();
    } catch (err) {
      console.error(err);
      toast.error("User delete failed.");
    } finally {
      setUserActionId(null);
    }
  };

  const formatAuditAction = (action) =>
    String(action || "")
      .replace(/_/g, " ")
      .replace(/^\w/, (char) => char.toUpperCase());

  return (
    <div className="mb-8 space-y-6">
      <section className="card-surface p-4 sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="eyebrow">
              Admin review
            </p>
            <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
              Pending PDF approvals
            </h2>
            <p className="muted-text mt-2">
              Approve or reject uploads with clear feedback for contributors.
            </p>
          </div>
          <div className="action-row">
            <button onClick={fetchPendingPdfs} className="btn-secondary">
              Refresh pending
            </button>
            <button onClick={fetchAllPdfs} className="btn-secondary">
              Refresh library
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="card-surface p-4 sm:p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Pending reviews
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Review the latest uploads before they go live.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-semibold">
              {pendingPdfs.length} pending
            </span>
          </div>

          {loadingPending ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
                />
              ))}
            </div>
          ) : pendingPdfs.length === 0 ? (
            <EmptyState
              message="No pending papers"
              submessage="Everything is up to date."
            />
          ) : (
            <div className="space-y-4">
              {pendingPdfs.map((pdf) => (
                <motion.div
                  key={pdf._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {pdf.title}
                      </p>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {pdf.college} · {pdf.course} · Sem {pdf.semester} ·{" "}
                        {pdf.year}
                      </p>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Submitted by{" "}
                        <span className="font-medium">
                          {uploaderName(pdf)}
                        </span>
                      </p>
                      {duplicateLabel(pdf) && (
                        <p className="mt-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                          {duplicateLabel(pdf)}
                        </p>
                      )}
                    </div>
                    <div className="action-row md:justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          window.open(
                            `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdf.url)}`,
                            "_blank",
                          )
                        }
                        className="btn-secondary"
                      >
                        <Eye className="w-4 h-4" /> Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReviewingId(pdf._id);
                          setReviewComment("");
                        }}
                        className="btn-primary"
                      >
                        <FileText className="w-4 h-4" /> Review
                      </button>
                    </div>
                  </div>

                  {reviewingId === pdf._id && (
                    <div className="mt-4 space-y-3">
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="input-primary w-full"
                        placeholder="Enter rejection reason if rejecting or leave comments for the uploader"
                        rows={4}
                      />
                      <div className="action-row">
                        <button
                          type="button"
                          onClick={() => handleReview(pdf._id, "approved")}
                          className="btn-primary"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReview(pdf._id, "rejected")}
                          className="danger-button"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewingId(null)}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="card-surface p-4 sm:p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Full library
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage live content and bulk operations.
              </p>
            </div>
            <div className="action-row">
              <button
                type="button"
                onClick={handleSelectAll}
                className="btn-secondary"
              >
                {allSelected ? "Clear" : "Select all"}
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="btn-secondary"
              >
                Delete selected
              </button>
            </div>
          </div>

          {loadingAll ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
                />
              ))}
            </div>
          ) : allPdfs.length === 0 ? (
            <EmptyState
              message="No library papers"
              submessage="There are no PDFs in the system right now."
            />
          ) : (
            <div className="space-y-3">
              {allPdfs.map((pdf) => (
                <div
                  key={pdf._id}
                  className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-gray-900 dark:text-white">
                        {pdf.title}
                      </p>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass(pdf.status)}`}
                      >
                        {pdf.status === "approved"
                          ? "accepted"
                          : pdf.status || "pending"}
                      </span>
                      {pdf.editedAfterReview && (
                        <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          edited
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {pdf.college} · {pdf.course} · Sem {pdf.semester} ·{" "}
                      {pdf.year}
                    </p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Uploaded by {uploaderName(pdf)} ({uploaderRole(pdf)})
                    </p>
                    {["rejected", "deleted"].includes(pdf.status) && (
                      <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                        Reason: {pdf.reviewComment || "No reason provided."}
                      </p>
                    )}
                    {pdf.status === "deleted" && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Deleted by {deletedByName(pdf)} ({deletedByRole(pdf)})
                      </p>
                    )}
                    {duplicateLabel(pdf) && (
                      <p className="mt-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                        {duplicateLabel(pdf)}
                      </p>
                    )}
                  </div>
                  <div className="action-row lg:justify-end">
                    <button
                      type="button"
                      onClick={() => toggleSelect(pdf._id)}
                      className={`btn-secondary ${selectedIds.has(String(pdf._id)) ? "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:text-white dark:hover:bg-indigo-700" : ""}`}
                    >
                      {selectedIds.has(String(pdf._id)) ? "Selected" : "Select"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        window.open(
                          `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdf.url)}`,
                          "_blank",
                        )
                      }
                      className="btn-secondary"
                    >
                      <Eye className="w-4 h-4" /> Preview
                    </button>
                    {pdf.status === "deleted" && (
                      <button
                        type="button"
                        onClick={() => handleRestore(pdf)}
                        className="success-button"
                      >
                        <RotateCcw className="w-4 h-4" /> Restore
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm("Permanently delete this PDF?")) {
                          return;
                        }
                        try {
                          const res = await fetch(
                            `${API_BASE_URL}/pdf/${pdf._id}`,
                            {
                              method: "DELETE",
                              headers: {
                                "Content-Type": "application/json",
                                ...authHeader(),
                              },
                              body: JSON.stringify({ permanent: true }),
                            },
                          );
                          const data = await res.json();
                          if (!res.ok) {
                            toast.error(data.message || "Delete failed");
                            return;
                          }
                          toast.success("PDF deleted");
                          fetchPendingPdfs();
                          fetchAllPdfs();
                          fetchAuditLogs();
                          refresh();
                        } catch (err) {
                          console.error(err);
                          toast.error("Delete failed");
                        }
                      }}
                      className="danger-button"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
              type="button"
              onClick={handleDeleteAll}
              className="btn-secondary w-full"
            >
              Delete all PDFs
            </button>
          </div>
        </div>
      </section>

      <section className="card-surface p-4 sm:p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                User management
              </h3>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage roles, bans, and contribution counts.
            </p>
          </div>
          <button type="button" onClick={fetchUsers} className="btn-secondary">
            Refresh users
          </button>
        </div>

        {loadingUsers ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
              />
            ))}
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            message="No users yet"
            submessage="New accounts will appear here."
          />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {users.map((user) => (
              <div
                key={user._id}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {user.username}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleClass(user.role)}`}
                      >
                        {user.role}
                      </span>
                      {user.isBanned && (
                        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900 dark:text-red-200">
                          banned
                        </span>
                      )}
                      {user.deletionScheduledFor && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                          deletion pending
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      {user.contributionCount || 0} approved contribution
                      {(user.contributionCount || 0) === 1 ? "" : "s"}
                    </p>
                    {user.isBanned && (
                      <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                        {user.banReason || "No ban reason provided."}
                      </p>
                    )}
                    {user.deletionScheduledFor && (
                      <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                        Deletes on{" "}
                        {new Date(user.deletionScheduledFor).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="action-row sm:justify-end">
                    {user.role === "admin" ? (
                      <button
                        type="button"
                        disabled={userActionId === user._id}
                        onClick={() => updateUserRole(user, "user")}
                        className="btn-secondary"
                      >
                        <ShieldCheck className="h-4 w-4" /> Demote
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={userActionId === user._id}
                        onClick={() => updateUserRole(user, "admin")}
                        className="btn-primary"
                      >
                        <ShieldCheck className="h-4 w-4" /> Promote
                      </button>
                    )}
                    {user.isBanned ? (
                      <button
                        type="button"
                        disabled={userActionId === user._id}
                        onClick={() => updateUserBan(user, false)}
                        className="success-button"
                      >
                        <Ban className="h-4 w-4" /> Unban
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={userActionId === user._id}
                        onClick={() => updateUserBan(user, true)}
                        className="danger-button"
                      >
                        <Ban className="h-4 w-4" /> Ban
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={userActionId === user._id}
                      onClick={() => resetUserPassword(user)}
                      className="btn-secondary"
                    >
                      <KeyRound className="h-4 w-4" /> Reset password
                    </button>
                    <button
                      type="button"
                      disabled={
                        userActionId === user._id ||
                        String(currentUserId) === String(user._id)
                      }
                      onClick={() => deleteUser(user)}
                      className="danger-button"
                    >
                      <UserX className="h-4 w-4" /> Delete user
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card-surface p-4 sm:p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent audit activity
              </h3>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Uploads, edits, reviews, deletions, and restores.
            </p>
          </div>
          <button type="button" onClick={fetchAuditLogs} className="btn-secondary">
            Refresh audit
          </button>
        </div>

        {loadingAudit ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
              />
            ))}
          </div>
        ) : auditLogs.length === 0 ? (
          <EmptyState
            message="No audit activity yet"
            submessage="Lifecycle events will appear here as admins and users work."
          />
        ) : (
          <div className="divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
            {auditLogs.map((log) => (
              <div
                key={log._id}
                className="grid gap-2 bg-gray-50 p-4 dark:bg-gray-800 sm:grid-cols-[1fr_auto]"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatAuditAction(log.action)} · {log.pdfTitle || "PDF"}
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {log.actor?.username || "System"} ({log.actor?.role || "user"})
                    {log.statusFrom || log.statusTo
                      ? ` · ${log.statusFrom || "new"} → ${log.statusTo || "removed"}`
                      : ""}
                  </p>
                  {log.reason && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {log.reason}
                    </p>
                  )}
                </div>
                <time className="text-sm text-gray-500 dark:text-gray-400 sm:text-right">
                  {new Date(log.createdAt).toLocaleString()}
                </time>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminPanel;

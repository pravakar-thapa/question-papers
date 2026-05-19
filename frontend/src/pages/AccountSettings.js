import { apiRequest } from "../utils/apiRequest";
import { useState } from "react";
import { KeyRound, Trash2, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";

function AccountSettings({ account, onAccountUpdated, onLogout }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [loading, setLoading] = useState("");

  const deletionDate = account?.deletionScheduledFor
    ? new Date(account.deletionScheduledFor)
    : null;

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setLoading("password");

    try {
      const response = await apiRequest("/me/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        toast.error(response.message || "Password change failed");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password changed");
    } catch (err) {
      console.error(err);
      toast.error("Password change failed");
    } finally {
      setLoading("");
    }
  };

  const handleDeletionRequest = async (event) => {
    event.preventDefault();
    if (!window.confirm("Schedule your account for deletion in 30 days?")) {
      return;
    }

    setLoading("delete");
    try {
      const response = await apiRequest("/me", {
        method: "DELETE",
        body: JSON.stringify({
          password: deletePassword,
          reason: deleteReason,
        }),
      });

      if (!response.ok) {
        toast.error(response.message || "Deletion request failed");
        return;
      }

      setDeletePassword("");
      setDeleteReason("");
      await onAccountUpdated();
      toast.success("Account deletion scheduled");
    } catch (err) {
      console.error(err);
      toast.error("Deletion request failed");
    } finally {
      setLoading("");
    }
  };

  const handleCancelDeletion = async () => {
    setLoading("cancel");
    try {
      const response = await apiRequest("/me/deletion-request", {
        method: "PATCH",
      });

      if (!response.ok) {
        toast.error(response.message || "Cancel failed");
        return;
      }

      await onAccountUpdated();
      toast.success("Account deletion cancelled");
    } catch (err) {
      console.error(err);
      toast.error("Cancel failed");
    } finally {
      setLoading("");
    }
  };

  if (!account) return null;

  return (
    <section className="card-surface mb-8 p-4 sm:p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="eyebrow">Account</p>
          <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
            Security settings
          </h2>
          <p className="muted-text mt-2">
            Signed in as {account.username}. Manage your password and account
            deletion request.
          </p>
        </div>
        {deletionDate && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
            Account deletion scheduled for {deletionDate.toLocaleDateString()}.
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <form
          className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
          onSubmit={handlePasswordChange}
        >
          <div className="mb-4 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Change password
            </h3>
          </div>
          <div className="grid gap-3">
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Current password"
              className="input-primary w-full"
              required
            />
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="New password"
              className="input-primary w-full"
              required
            />
            <button
              type="submit"
              disabled={loading === "password"}
              className="btn-primary justify-self-start"
            >
              <KeyRound className="h-4 w-4" />
              {loading === "password" ? "Saving..." : "Change password"}
            </button>
          </div>
        </form>

        <form
          className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
          onSubmit={handleDeletionRequest}
        >
          <div className="mb-4 flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Delete account
            </h3>
          </div>
          {deletionDate ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Your account is waiting for permanent deletion. You can cancel
                before the scheduled date.
              </p>
              <button
                type="button"
                onClick={handleCancelDeletion}
                disabled={loading === "cancel"}
                className="success-button"
              >
                <RotateCcw className="h-4 w-4" />
                {loading === "cancel" ? "Cancelling..." : "Cancel deletion"}
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              <input
                type="password"
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
                placeholder="Confirm password"
                className="input-primary w-full"
                required
              />
              <textarea
                value={deleteReason}
                onChange={(event) => setDeleteReason(event.target.value)}
                placeholder="Reason (optional)"
                className="input-primary w-full"
                rows={3}
              />
              <button
                type="submit"
                disabled={loading === "delete"}
                className="danger-button justify-self-start"
              >
                <Trash2 className="h-4 w-4" />
                {loading === "delete"
                  ? "Scheduling..."
                  : "Schedule deletion"}
              </button>
            </div>
          )}
        </form>
      </div>

      {deletionDate && (
        <button
          type="button"
          onClick={onLogout}
          className="btn-secondary mt-4"
        >
          Logout
        </button>
      )}
    </section>
  );
}

export default AccountSettings;

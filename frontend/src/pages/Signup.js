import { signupUser } from "../api/authApi";
import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

function SignupPage({ onSignupSuccess, onBackToLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { ok, data } = await signupUser(username, password);

      if (!ok) {
        toast.error(data?.message || "Signup failed");
        return;
      }

      toast.success("Account created. Please login.");
      onSignupSuccess();
    } catch (err) {
      console.error(err);
      toast.error("Signup error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-surface w-full max-w-md p-6 shadow-2xl sm:p-8"
      >
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Create account</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Sign up to save papers, upload content, and manage your dashboard.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Username</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="input-primary mt-2 w-full"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-primary mt-2 w-full"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="input-primary mt-2 w-full"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onBackToLogin}
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Login
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default SignupPage;

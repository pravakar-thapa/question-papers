import { loginUser } from "../api/authApi";
import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

function Login({ onLogin, onShowSignup }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { ok, data } = await loginUser(username, password);

      if (!ok) {
        toast.error(data?.message || "Login failed");
        setLoading(false);
        return;
      }

      const token = data?.data?.token;
      if (!token) {
        toast.error("Login succeeded but no session token was returned.");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", token);
      toast.success("Welcome back!");
      onLogin();
    } catch (err) {
      console.error(err);
      toast.error("Login failed. Please try again.");
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
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Login</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Sign in to access saved papers, uploads, and your personal dashboard.
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

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Signing in..." : "Continue to Dashboard"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={onShowSignup}
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Sign up
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;

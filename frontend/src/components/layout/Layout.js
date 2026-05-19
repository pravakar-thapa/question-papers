import { Moon, Sun, BookOpen } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

function Layout({
  children,
  username,
  isLoggedIn,
  handleLogout,
  setShowLogin,
}) {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-800/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-16 flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Logo */}
            <div className="flex min-w-0 items-center gap-2">
              <BookOpen className="h-8 w-8 shrink-0 text-indigo-600 dark:text-indigo-400" />
              <h1 className="truncate text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                Question Papers
              </h1>
            </div>

            {/* Right side */}
            <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className="rounded-lg bg-gray-100 p-2 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                )}
              </button>

              {/* Auth buttons */}
              {!isLoggedIn ? (
                <button
                  className="btn-primary"
                  onClick={() => setShowLogin(true)}
                >
                  Login
                </button>
              ) : (
                <div className="flex min-w-0 items-center gap-3">
                  <span className="hidden max-w-[11rem] truncate font-medium text-gray-700 dark:text-gray-300 sm:inline">
                    Welcome, {username}
                  </span>
                  <button
                    className="danger-button"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Built for students and educators · Powered by React, Node, and
          Tailwind.
        </div>
      </footer>
    </div>
  );
}

export default Layout;

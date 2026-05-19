import {
  fetchPDFsApi,
  fetchSavedPdfsApi,
  fetchMyUploadsApi,
  fetchStatsApi,
} from "./api/pdfApi";
import { jwtDecode } from "jwt-decode";
import { useCallback, useEffect, useRef, useState } from "react";
import Home from "./pages/Home";
import Layout from "./components/layout/Layout";
import Login from "./pages/Login";
import SignupPage from "./pages/Signup";
import UploadPanel from "./pages/Upload";
import AdminPanel from "./pages/Admin";
import AccountSettings from "./pages/AccountSettings";
import { apiRequest } from "./utils/apiRequest";

function App() {
  const [pdfs, setPdfs] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [authNotice, setAuthNotice] = useState("");
  const sessionTimerRef = useRef(null);
  const [showSaved, setShowSaved] = useState(false);
  const [savedPdfs, setSavedPdfs] = useState([]);
  const [stats, setStats] = useState(null);
  const [username, setUsername] = useState("");
  const [myUploads, setMyUploads] = useState([]);
  const [showUploads, setShowUploads] = useState(false);
  const [account, setAccount] = useState(null);
  const [activeView, setActiveView] = useState("browse");

  const [filters, setFilters] = useState({
    title: "",
    college: "",
    course: "",
    semester: "",
    year: "",
    sort: "",
  });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 12,
    pages: 1,
    total: 0,
  });

  const fetchPDFs = useCallback(
    async (pageNumber = 1) => {
      try {
        setLoading(true);
        const response = await fetchPDFsApi(filters, pageNumber);

        if (!response.ok) {
          console.error("PDF fetch failed", response.message);
          setPdfs([]);
          return;
        }

        const result = response.data;
        setPdfs(result?.data?.pdfs || []);
        setPagination((prev) => result?.data?.pagination || prev);
      } catch (err) {
        console.error(err);
        setPdfs([]);
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );
  //=========fetch fun=================
  const fetchStats = async () => {
    try {
      const response = await fetchStatsApi();
      if (response.ok) {
        setStats(response.data.data);
      } else {
        console.error("Stats fetch failed", response.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  //==================fetch func=====================
  const fetchMyUploads = async () => {
    try {
      const response = await fetchMyUploadsApi();
      if (response.ok) {
        setMyUploads(response.data.data.uploads || []);
      } else {
        console.error("My uploads fetch failed", response.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSavedPdfs = useCallback(async () => {
    try {
      const response = await fetchSavedPdfsApi();
      if (response.ok) {
        setSavedPdfs(response.data.data.savedPdfs || []);
      } else {
        console.error("Saved PDFs fetch failed", response.message);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleSavedChange = useCallback((pdf, saved) => {
    setSavedPdfs((currentSavedPdfs) => {
      if (saved) {
        const alreadySaved = currentSavedPdfs.some(
          (savedPdf) => savedPdf._id === pdf._id,
        );
        return alreadySaved ? currentSavedPdfs : [pdf, ...currentSavedPdfs];
      }

      return currentSavedPdfs.filter((savedPdf) => savedPdf._id !== pdf._id);
    });
  }, []);

  const clearSessionTimer = useCallback(() => {
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
  }, []);

  const clearAuthState = useCallback(() => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setUserRole(null);
    setAccount(null);
    setActiveView("browse");
    clearSessionTimer();
  }, [clearSessionTimer]);

  const fetchAccount = useCallback(async () => {
    try {
      const response = await apiRequest("/me");
      if (response.ok) {
        setAccount(response.data.data.user);
      } else if (response.status === 401) {
        clearAuthState();
      }
    } catch (err) {
      console.error(err);
    }
  }, [clearAuthState]);

  const handleSessionExpired = useCallback(() => {
    clearAuthState();
    setAuthNotice("Your session expired. Please login again.");
  }, [clearAuthState]);

  const applyToken = useCallback(
    (token) => {
      try {
        const decoded = jwtDecode(token);
        const expiryMs = decoded?.exp ? decoded.exp * 1000 : null;

        if (!expiryMs || expiryMs <= Date.now()) {
          handleSessionExpired();
          return false;
        }

        setAuthNotice("");
        setIsLoggedIn(true);
        setUserRole(decoded.role || null);
        setUsername(decoded.username || "");

        clearSessionTimer();
        sessionTimerRef.current = setTimeout(
          handleSessionExpired,
          expiryMs - Date.now(),
        );

        return true;
      } catch {
        clearAuthState();
        setAuthNotice("Invalid session token. Please login again.");
        return false;
      }
    },
    [handleSessionExpired, clearAuthState, clearSessionTimer],
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) applyToken(token);
  }, [applyToken]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchSavedPdfs();
      fetchAccount();
    } else {
      setSavedPdfs([]);
      setShowSaved(false);
      setShowUploads(false);
      setAccount(null);
    }
  }, [isLoggedIn, fetchSavedPdfs, fetchAccount]);

  useEffect(() => {
    if (activeView === "admin" && userRole !== "admin") {
      setActiveView("browse");
    }
  }, [activeView, userRole]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  //============Auto Fetch Stats & PDFs================
  useEffect(() => {
    const loadData = async () => {
      await fetchPDFs(page);
      if (userRole === "admin" && activeView === "admin") {
        await fetchStats();
      }
    };
    loadData();
  }, [filters, page, userRole, activeView, fetchPDFs]);

  useEffect(() => {
    return () => clearSessionTimer();
  }, [clearSessionTimer]);
  const handleLoginSuccess = () => {
    const token = localStorage.getItem("token");
    if (token) {
      return applyToken(token);
    }
    return false;
  };
  const handleLogout = () => {
    clearAuthState();
    setAuthNotice("");
  };

  const viewButtonClass = (view) =>
    activeView === view ? "btn-primary" : "btn-secondary";
  const libraryButtonClass = (isActive) =>
    activeView === "browse" && isActive ? "btn-primary" : "btn-secondary";

  const renderHome = () => (
    <Home
      loading={loading}
      pdfs={pdfs}
      savedPdfs={savedPdfs}
      myUploads={myUploads}
      showSaved={showSaved}
      showUploads={showUploads}
      setShowSaved={setShowSaved}
      setShowUploads={setShowUploads}
      fetchSavedPdfs={fetchSavedPdfs}
      onSavedChange={handleSavedChange}
      fetchMyUploads={fetchMyUploads}
      filters={filters}
      setFilters={setFilters}
      userRole={userRole}
      isLoggedIn={isLoggedIn}
      fetchPDFs={fetchPDFs}
      page={page}
      setPage={setPage}
      pagination={pagination}
    />
  );

  return (
    <Layout
      username={username}
      isLoggedIn={isLoggedIn}
      handleLogout={handleLogout}
      setShowLogin={setShowLogin}
    >
      {!!authNotice && (
        <p className="mb-4 rounded-lg border border-yellow-300 bg-yellow-100 p-3 text-sm text-yellow-800">
          {authNotice}
        </p>
      )}

      {isLoggedIn && (
        <section className="card-surface mb-6 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="eyebrow">Quick actions</p>
              <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                Jump into your library
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              <button
                type="button"
                onClick={() => setActiveView("browse")}
                className={viewButtonClass("browse")}
              >
                Browse
              </button>
              <button
                type="button"
                onClick={() => setActiveView("upload")}
                className={viewButtonClass("upload")}
              >
                Upload
              </button>
              <button
                type="button"
                onClick={() => setActiveView("account")}
                className={viewButtonClass("account")}
              >
                Account
              </button>
              {userRole === "admin" && (
                <button
                  type="button"
                  onClick={() => setActiveView("admin")}
                  className={viewButtonClass("admin")}
                >
                  Admin
                </button>
              )}
            </div>
          </div>

          {activeView === "browse" && (
            <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setShowSaved(false);
                    setShowUploads(false);
                  }}
                  className={libraryButtonClass(!showSaved && !showUploads)}
                >
                  All Papers
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setShowSaved(true);
                    setShowUploads(false);
                    await fetchSavedPdfs();
                  }}
                  className={libraryButtonClass(showSaved)}
                >
                  Saved Papers
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setShowUploads(true);
                    setShowSaved(false);
                    await fetchMyUploads();
                  }}
                  className={libraryButtonClass(showUploads)}
                >
                  My Uploads
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {activeView === "admin" && userRole === "admin" && stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="card-surface p-4 text-center text-gray-900 dark:text-white">
            <h3 className="text-2xl font-semibold">{stats.totalPdfs}</h3>
            <p className="muted-text">Total PDFs</p>
          </div>

          <div className="card-surface p-4 text-center text-gray-900 dark:text-white">
            <h3 className="text-2xl font-semibold">{stats.approvedPdfs}</h3>
            <p className="muted-text">Approved PDFs</p>
          </div>

          <div className="card-surface p-4 text-center text-gray-900 dark:text-white">
            <h3 className="text-2xl font-semibold">{stats.pendingPdfs}</h3>
            <p className="muted-text">Pending PDFs</p>
          </div>

          <div className="card-surface p-4 text-center text-gray-900 dark:text-white">
            <h3 className="text-2xl font-semibold">{stats.rejectedPdfs}</h3>
            <p className="muted-text">Rejected PDFs</p>
          </div>

          <div className="card-surface p-4 text-center text-gray-900 dark:text-white">
            <h3 className="text-2xl font-semibold">{stats.totalUsers}</h3>
            <p className="muted-text">Total Users</p>
          </div>

          <div className="card-surface p-4 text-center text-gray-900 dark:text-white">
            <h3 className="text-2xl font-semibold">{stats.userUploads}</h3>
            <p className="muted-text">User Uploads</p>
          </div>

          <div className="card-surface p-4 text-center text-gray-900 dark:text-white">
            <h3 className="text-2xl font-semibold">{stats.adminUploads}</h3>
            <p className="muted-text">Admin Uploads</p>
          </div>
        </div>
      )}

      {activeView === "admin" && userRole === "admin" && isLoggedIn && (
        <AdminPanel refresh={fetchPDFs} />
      )}
      {activeView === "account" && isLoggedIn && !showLogin && (
        <AccountSettings
          account={account}
          onAccountUpdated={fetchAccount}
          onLogout={handleLogout}
        />
      )}
      {activeView === "upload" && isLoggedIn && !showLogin && (
        <UploadPanel
          refresh={fetchPDFs}
          isUploaderAdmin={userRole === "admin"}
        />
      )}
      {showSignup && !isLoggedIn && (
        <SignupPage
          onSignupSuccess={() => {
            setShowSignup(false);
            setShowLogin(true);
          }}
          onBackToLogin={() => setShowSignup(false)}
        />
      )}
      {showLogin && !isLoggedIn && (
        <Login
          onLogin={() => {
            if (handleLoginSuccess() !== false) {
              setShowLogin(false);
            }
          }}
          onShowSignup={() => {
            setShowLogin(false);
            setShowSignup(true);
          }}
        />
      )}
      {(!isLoggedIn || activeView === "browse") && renderHome()}
    </Layout>
  );
}

export default App;

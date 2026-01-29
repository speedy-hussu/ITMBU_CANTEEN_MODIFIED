import { useState, useEffect } from "react";
import { Calculator, Monitor, Mail, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { loginApi } from "../api/auth";

export default function Login() {
  const [activeTab, setActiveTab] = useState<"POS" | "KDS">("POS");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  const navigate = useNavigate();
  const { login, user: currentUser } = useAuthStore();

  // ✅ 1. Industry Practice: Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate(currentUser.role === "POS" ? "/pos" : "/kds", { replace: true });
    }
  }, [currentUser, navigate]);

  const handleTabChange = (tab: "POS" | "KDS") => {
    setActiveTab(tab);
    setCredentials({ username: "", password: "" });
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // ✅ 2. Call your Fastify Backend
      const response = await loginApi({
        ...credentials,
        role: activeTab,
      });

      if (response.user) {
        // ✅ 3. Update Zustand Store
        login({
          username: response.user.username,
          role: response.user.role,
        });

        // ✅ 4. Navigate based on role
        navigate(response.user.role === "POS" ? "/pos" : "/kds");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Login failed. Check your credentials.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            STAAF LOGIN
          </h1>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Sliding Tabs */}
          <div className="relative flex bg-gray-100 p-1 m-6 rounded-2xl">
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-0.25rem)] tab-gradient-active rounded-xl shadow-md transition-all duration-300 ease-out ${
                activeTab === "POS" ? "left-1" : "left-[calc(50%+0.25rem)]"
              }`}
            />
            <button
              onClick={() => handleTabChange("POS")}
              className={`relative flex-1 py-3 z-10 font-semibold transition-colors ${activeTab === "POS" ? "text-white" : "text-gray-500"}`}
            >
              <div className="flex items-center justify-center gap-2">
                <Calculator size={18} /> POS
              </div>
            </button>
            <button
              onClick={() => handleTabChange("KDS")}
              className={`relative flex-1 py-3 z-10 font-semibold transition-colors ${activeTab === "KDS" ? "text-white" : "text-gray-500"}`}
            >
              <div className="flex items-center justify-center gap-2">
                <Monitor size={18} /> KDS
              </div>
            </button>
          </div>

          <form onSubmit={handleLogin} className="p-8 pt-0 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Enter username"
                  value={credentials.username}
                  onChange={(e) =>
                    setCredentials({
                      ...credentials,
                      username: e.target.value.trim(),
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="••••••••"
                  value={credentials.password}
                  onChange={(e) =>
                    setCredentials({
                      ...credentials,
                      password: e.target.value.trim(),
                    })
                  }
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 btn-gradient-primary  text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

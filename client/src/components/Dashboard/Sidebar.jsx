import { useState, useEffect } from "react";
import {
  InboxIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  ShoppingBagIcon,
  UserIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const categories = [
  { id: "all", name: "All Emails", icon: InboxIcon, count: null },
  { id: "Jobs", name: "Jobs", icon: BriefcaseIcon, color: "text-blue-600" },
  {
    id: "College",
    name: "College",
    icon: AcademicCapIcon,
    color: "text-purple-600",
  },
  {
    id: "Shopping",
    name: "Shopping",
    icon: ShoppingBagIcon,
    color: "text-green-600",
  },
  {
    id: "Personal",
    name: "Personal",
    icon: UserIcon,
    color: "text-yellow-600",
  },
  {
    id: "Spam",
    name: "Spam",
    icon: ExclamationTriangleIcon,
    color: "text-red-600",
  },
];

export default function Sidebar({
  selectedCategory,
  onCategoryChange,
  selectedAccount,
  onAccountChange,
}) {
  const { logout } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});

  useEffect(() => {
    fetchAccounts();
    fetchCategoryCounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await api.get("/api/accounts");
      setAccounts(res.data);
    } catch (error) {
      console.error("Failed to fetch accounts");
    }
  };

  const fetchCategoryCounts = async () => {
    try {
      const res = await api.get("/api/emails");
      const counts = {};
      res.data.forEach((email) => {
        counts[email.category] = (counts[email.category] || 0) + 1;
      });
      setCategoryCounts(counts);
    } catch (error) {
      console.error("Failed to fetch counts");
    }
  };

  // const addAccount = () => {
  //   const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  //   window.location.href = `${API_URL}/auth/google/add-account`;
  // };

  const addAccount = () => {
    // ✅ PRODUCTION URL
    const API_URL = "https://mail-mind-372t.onrender.com";
    window.location.href = `${API_URL}/auth/google/add-account`;
  };
  return (
    <div className="h-full flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
          <InboxIcon className="w-6 h-6" />
          MailMind
        </h1>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
            Categories
          </h3>
          <nav className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${
                    selectedCategory === cat.id
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }
                `}
              >
                <cat.icon className={`w-5 h-5 ${cat.color || ""}`} />
                <span className="flex-1 text-left">{cat.name}</span>
                {categoryCounts[cat.id] > 0 && (
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                    {categoryCounts[cat.id]}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Accounts */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
            Accounts
          </h3>
          <nav className="space-y-1">
            <button
              onClick={() => onAccountChange("all")}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${
                  selectedAccount === "all"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-50"
                }
              `}
            >
              <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-xs text-indigo-600">A</span>
              </div>
              <span className="flex-1 text-left">All Accounts</span>
            </button>

            {accounts.map((acc) => (
              <button
                key={acc._id}
                onClick={() => onAccountChange(acc._id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${
                    selectedAccount === acc._id
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }
                `}
              >
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-xs text-green-600">
                    {acc.email[0].toUpperCase()}
                  </span>
                </div>
                <span className="flex-1 text-left truncate">{acc.email}</span>
              </button>
            ))}

            <button
              onClick={addAccount}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Add Account</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Logout */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

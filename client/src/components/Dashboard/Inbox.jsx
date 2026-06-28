import { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import api from "../../services/api";
import EmailCard from "./EmailCard";

export default function Inbox({
  selectedCategory,
  selectedAccount,
  onEmailSelect,
  selectedEmailId,
}) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchEmails();
  }, [selectedCategory, selectedAccount]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== "all")
        params.append("category", selectedCategory);
      if (selectedAccount !== "all")
        params.append("accountId", selectedAccount);

      const res = await api.get(`/api/emails?${params}`);
      setEmails(res.data);
    } catch (error) {
      console.error("Failed to fetch emails");
    } finally {
      setLoading(false);
    }
  }; // ✅ fetchEmails closing brace

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.post("/api/emails/sync-all");
      setTimeout(fetchEmails, 3000);
    } catch (error) {
      console.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const filteredEmails = emails.filter(
    (email) =>
      searchQuery === "" ||
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.from.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Search & Actions */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {filteredEmails.length} emails
          </span>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
          >
            <ArrowPathIcon
              className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}
            />
            {syncing ? "Syncing..." : "Sync"}
          </button>
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No emails found</p>
          </div>
        ) : (
          filteredEmails.map((email) => (
            <EmailCard
              key={email._id}
              email={email}
              isSelected={selectedEmailId === email._id}
              onClick={() => onEmailSelect(email)}
            />
          ))
        )}
      </div>
    </div>
  );
}

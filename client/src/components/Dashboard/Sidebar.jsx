import { useState } from "react";
// ... existing imports

export default function Sidebar({
  selectedCategory,
  onCategoryChange,
  selectedAccount,
  onAccountChange,
}) {
  const { logout } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // ... existing fetchAccounts, fetchCategoryCounts

  const handleAddAccount = async (e) => {
    e.preventDefault();
    setAddError("");
    setAddLoading(true);

    try {
      await api.post("/auth/add-gmail", {
        email: newEmail,
        appPassword: newPassword,
      });
      setShowAddModal(false);
      setNewEmail("");
      setNewPassword("");
      fetchAccounts(); // Refresh list
    } catch (err) {
      setAddError(err.response?.data?.message || "Failed to add account");
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* ... existing logo and categories */}

      {/* Accounts Section */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
          Accounts
        </h3>
        <nav className="space-y-1">
          {/* ... existing All Accounts button */}

          {accounts.map((acc) => (
            <button
              key={acc._id}
              onClick={() => onAccountChange(acc._id)}
              // ... existing className
            >
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-xs text-green-600">
                  {acc.email[0].toUpperCase()}
                </span>
              </div>
              <span className="flex-1 text-left truncate">{acc.email}</span>
            </button>
          ))}

          {/* Add Account Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Add Account</span>
          </button>
        </nav>
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl m-4">
            <h3 className="text-lg font-bold mb-4">Add Gmail Account</h3>

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-xs">
              <p className="font-semibold text-yellow-800 mb-1">
                How to get App Password:
              </p>
              <ol className="text-yellow-700 list-decimal list-inside space-y-1">
                <li>Go to Google Account → Security</li>
                <li>Enable 2-Step Verification</li>
                <li>Click "App Passwords"</li>
                <li>Select "Mail" → "Other" → Name: "MailMind"</li>
                <li>Copy 16-character password</li>
              </ol>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-3">
              <input
                type="email"
                placeholder="yourname@gmail.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <input
                type="password"
                placeholder="App Password (16 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              {addError && <p className="text-red-500 text-sm">{addError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
                >
                  {addLoading ? "Connecting..." : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ... existing logout */}
    </div>
  );
}

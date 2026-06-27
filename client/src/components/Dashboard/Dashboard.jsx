import { useState } from "react";
import Sidebar from "./Sidebar";
import Inbox from "./Inbox";
import EmailDetail from "./EmailDetail";
import { Bars3Icon } from "@heroicons/react/24/outline";

export default function Dashboard() {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform lg:transform-none
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <Sidebar
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedAccount={selectedAccount}
          onAccountChange={setSelectedAccount}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-semibold text-gray-800">Unified Inbox</h2>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Email List */}
          <div
            className={`flex-1 min-w-0 ${selectedEmail ? "hidden lg:block lg:w-1/3" : ""}`}
          >
            <Inbox
              selectedCategory={selectedCategory}
              selectedAccount={selectedAccount}
              onEmailSelect={setSelectedEmail}
              selectedEmailId={selectedEmail?._id}
            />
          </div>

          {/* Email Detail */}
          {selectedEmail && (
            <div className="fixed inset-0 lg:static lg:w-2/3 bg-white z-30 lg:z-auto">
              <EmailDetail
                email={selectedEmail}
                onClose={() => setSelectedEmail(null)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

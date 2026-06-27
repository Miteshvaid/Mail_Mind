import { StarIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import api from "../../services/api";

const categoryStyles = {
  Jobs: "bg-blue-100 text-blue-800",
  College: "bg-purple-100 text-purple-800",
  Shopping: "bg-green-100 text-green-800",
  Personal: "bg-yellow-100 text-yellow-800",
  Spam: "bg-red-100 text-red-800",
  Uncategorized: "bg-gray-100 text-gray-800",
};

export default function EmailCard({ email, isSelected, onClick }) {
  const handleStar = async (e) => {
    e.stopPropagation();
    try {
      await api.patch(`/api/emails/${email._id}/star`);
      email.isStarred = !email.isStarred;
    } catch (error) {
      console.error("Failed to star");
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;

    if (diff < 24 * 60 * 60 * 1000) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return d.toLocaleDateString([], { weekday: "short" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div
      onClick={onClick}
      className={`
        p-4 border-b border-gray-100 cursor-pointer transition-all hover:bg-gray-50
        ${isSelected ? "bg-indigo-50 border-l-4 border-l-indigo-500" : ""}
        ${!email.isRead ? "bg-white" : "bg-gray-50/50"}
        priority-${email.priority}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Star */}
        <button
          onClick={handleStar}
          className="mt-1 text-gray-400 hover:text-yellow-400"
        >
          {email.isStarred ? (
            <StarIconSolid className="w-5 h-5 text-yellow-400" />
          ) : (
            <StarIcon className="w-5 h-5" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${categoryStyles[email.category] || categoryStyles.Uncategorized}`}
            >
              {email.category}
            </span>
            {email.priority === "high" && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                Job Offer!
              </span>
            )}
            {email.hasDeadline && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                Deadline
              </span>
            )}
            {!email.isRead && (
              <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
            )}
          </div>

          <h4
            className={`text-sm truncate ${!email.isRead ? "font-semibold text-gray-900" : "text-gray-600"}`}
          >
            {email.fromName || email.from}
          </h4>

          <p
            className={`text-sm truncate ${!email.isRead ? "font-medium text-gray-800" : "text-gray-500"}`}
          >
            {email.subject}
          </p>

          <p className="text-xs text-gray-400 truncate mt-1">{email.snippet}</p>

          {/* AI Summary Preview */}
          {email.aiSummary && (
            <p className="text-xs text-indigo-600 mt-1 line-clamp-2 bg-indigo-50 p-1.5 rounded">
              🤖 {email.aiSummary.substring(0, 100)}...
            </p>
          )}
        </div>

        {/* Date */}
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {formatDate(email.receivedAt)}
        </span>
      </div>
    </div>
  );
}

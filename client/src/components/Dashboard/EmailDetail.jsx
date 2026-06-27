import { useState } from "react";
import {
  ArrowLeftIcon,
  StarIcon,
  ArrowUturnLeftIcon,
  SparklesIcon,
  PaperAirplaneIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import api from "../../services/api";

export default function EmailDetail({ email, onClose }) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [suggestions, setSuggestions] = useState(email.replySuggestions || []);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const fetchSuggestions = async () => {
    if (suggestions.length > 0) return;

    setLoadingSuggestions(true);
    try {
      const res = await api.get(`/api/ai/replies/${email._id}`);
      setSuggestions(res.data.suggestions);
    } catch (error) {
      console.error("Failed to fetch suggestions");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const useSuggestion = (suggestion) => {
    setReplyText(suggestion);
    setShowReply(true);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 flex items-center gap-3">
        <button
          onClick={onClose}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                email.category === "Jobs"
                  ? "bg-blue-100 text-blue-800"
                  : email.category === "College"
                    ? "bg-purple-100 text-purple-800"
                    : email.category === "Shopping"
                      ? "bg-green-100 text-green-800"
                      : email.category === "Personal"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
              }`}
            >
              {email.category}
            </span>
            {email.priority === "high" && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                🔴 JOB OFFER DETECTED
              </span>
            )}
            {email.hasDeadline && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">
                ⏰ DEADLINE
              </span>
            )}
          </div>
        </div>

        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
          {email.isStarred ? (
            <StarIconSolid className="w-5 h-5 text-yellow-400" />
          ) : (
            <StarIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {email.subject}
          </h2>

          <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
              {(email.fromName || email.from)[0].toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-gray-700">
                {email.fromName || email.from}
              </p>
              <p>{formatDate(email.receivedAt)}</p>
            </div>
          </div>
        </div>

        {/* 🤖 AI Summary Box */}
        {email.aiSummary && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <SparklesIcon className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-indigo-900">AI Summary</h3>
            </div>
            <div className="text-sm text-indigo-800 whitespace-pre-line">
              {email.aiSummary}
            </div>
          </div>
        )}

        {/* Email Body */}
        <div className="prose prose-sm max-w-none text-gray-700">
          {email.bodyHtml ? (
            <div dangerouslySetInnerHTML={{ __html: email.bodyHtml }} />
          ) : (
            <pre className="whitespace-pre-wrap font-sans">{email.body}</pre>
          )}
        </div>

        {/* 💬 AI Reply Suggestions */}
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-indigo-600" />
            AI Reply Suggestions
          </h3>

          {suggestions.length === 0 && !loadingSuggestions && (
            <button
              onClick={fetchSuggestions}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Generate suggestions →
            </button>
          )}

          {loadingSuggestions && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
              Generating...
            </div>
          )}

          <div className="space-y-2">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => useSuggestion(suggestion)}
                className="w-full text-left p-3 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 rounded-lg text-sm text-gray-700 transition-colors"
              >
                <span className="font-medium text-indigo-600">
                  Suggestion {idx + 1}:
                </span>
                <p className="mt-1 line-clamp-2">{suggestion}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reply Actions */}
      <div className="border-t border-gray-200 p-4">
        {!showReply ? (
          <button
            onClick={() => setShowReply(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <ArrowUturnLeftIcon className="w-4 h-4" />
            Reply
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Reply to {email.from}
              </span>
              <button
                onClick={() => setShowReply(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write your reply..."
              rows={4}
              className="w-full border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowReply(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                <PaperAirplaneIcon className="w-4 h-4" />
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

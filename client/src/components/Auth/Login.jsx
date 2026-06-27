import { useAuth } from "../../context/AuthContext";
import { EnvelopeIcon, SparklesIcon } from "@heroicons/react/24/outline";

export default function Login() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
        <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
          <EnvelopeIcon className="w-8 h-8 text-indigo-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">MailMind</h1>
        <p className="text-gray-500 mb-8">
          AI-powered email management for your Gmail accounts
        </p>

        <button
          onClick={login}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 rounded-lg px-6 py-3 font-medium text-gray-700 hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200"
        >
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google"
            className="w-5 h-5"
          />
          Continue with Google
        </button>

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-400">
          <SparklesIcon className="w-4 h-4" />
          <span>Powered by AI</span>
        </div>
      </div>
    </div>
  );
}

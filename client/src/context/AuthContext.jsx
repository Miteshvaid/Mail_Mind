import { createContext, useState, useEffect, useContext } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Token validate karo
      api
        .get("/api/accounts")
        .then(() => setLoading(false))
        .catch(() => {
          localStorage.removeItem("token");
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = () => {
    // Redirect to Google OAuth
    window.location.href = "http://localhost:5000/auth/google";
  };

  const handleAuthCallback = (token) => {
    localStorage.setItem("token", token);
    setUser({ token });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    api.post("/auth/logout");
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, handleAuthCallback, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

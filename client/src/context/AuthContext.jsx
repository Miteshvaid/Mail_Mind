import { createContext, useState, useEffect, useContext } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
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
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    window.location.href = `${API_URL}/auth/google`;
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

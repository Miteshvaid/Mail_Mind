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
        .then(() => {
          setUser({ token });
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem("token");
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    console.log("Login called with:", email, password ? "YES" : "NO");

    const res = await api.post("/auth/login", { email, password });
    console.log("Login response:", res.data);

    const token = res.data.token;
    localStorage.setItem("token", token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (email, password, name) => {
    console.log("Register called with:", email, password ? "YES" : "NO", name);

    const res = await api.post("/auth/register", { email, password, name });
    console.log("Register response:", res.data);

    const token = res.data.token;
    localStorage.setItem("token", token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    api.post("/auth/logout");
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

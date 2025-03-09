"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean; // Added isAuthenticated property
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false, // Initialize isAuthenticated as false
  login: async () => false,
  register: async () => false,
  logout: () => {},
  refreshToken: async () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Initialize authentication state from localStorage if possible
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Check if we're in the browser and if there's a token
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_token") !== null;
    }
    return false;
  });

  // Base API URL
  const API_URL = "http://localhost:8000/api";

  // Helper function for API requests
  const apiRequest = async (endpoint: string, options = {}) => {
    const defaultOptions: RequestInit = {
      credentials: "include" as RequestCredentials,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };

    // Add Authorization header if token exists in localStorage
    const token = localStorage.getItem("auth_token");
    if (token) {
      defaultOptions.headers = {
        ...defaultOptions.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    const mergedOptions = { ...defaultOptions, ...options };

    return fetch(`${API_URL}${endpoint}`, mergedOptions);
  };

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      // Check if token exists in localStorage
      const token = localStorage.getItem("auth_token");
      if (!token) {
        console.log("No token in localStorage, user is not authenticated");
        setLoading(false);
        setIsAuthenticated(false);
        return;
      }

      try {
        console.log("Checking authentication status with token:", token.substring(0, 10) + "...");
        const response = await apiRequest("/auth/me");

        if (response.ok) {
          const userData = await response.json();
          console.log("Auth check successful:", userData);
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          console.log("Auth check failed, trying refresh token...");
          const refreshSuccessful = await refreshToken();
          if (!refreshSuccessful) {
            console.log("Refresh token failed, user is not authenticated");
            localStorage.removeItem("auth_token");
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        localStorage.removeItem("auth_token");
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting login for:", email);

      // Validate input before sending
      if (!email || !password) {
        console.error("Login error: Email or password missing");
        return false;
      }

      const response = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let errorMessage = "Login failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        console.error(`Login error (${response.status}):`, errorMessage);
        throw new Error(errorMessage);
      }

      const userData = await response.json();
      console.log("Login successful:", userData);

      // Store token in localStorage
      if (userData.tokens?.accessToken) {
        localStorage.setItem("auth_token", userData.tokens.accessToken);
        console.log("Token stored in localStorage");
      }

      setUser(userData.user);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  // Register function
  const register = async (
    username: string,
    email: string,
    password: string
  ) => {
    try {
      const response = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      const userData = await response.json();

      // Store token in localStorage
      if (userData.tokens?.accessToken) {
        localStorage.setItem("auth_token", userData.tokens.accessToken);
      }

      setUser(userData.user);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });

      // Remove token from localStorage
      localStorage.removeItem("auth_token");

      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout error:", error);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("auth_token");
    }
  };

  // Token refresh function
  const refreshToken = async () => {
    try {
      console.log("Attempting to refresh token...");
      const response = await apiRequest("/auth/refresh", { method: "POST" });

      if (!response.ok) {
        console.log("Token refresh failed:", await response.text());
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }

      const userData = await response.json();
      console.log("Token refresh successful:", userData);

      // Update token in localStorage if available
      if (userData.tokens?.accessToken) {
        localStorage.setItem("auth_token", userData.tokens.accessToken);
      }

      setUser(userData.user);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error("Token refresh error:", error);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("auth_token");
      return false;
    }
  };

  // Make the context value memoized to prevent unnecessary re-renders
  const contextValue = React.useMemo(
    () => ({
      user,
      loading,
      isAuthenticated,
      login,
      register,
      logout,
      refreshToken,
    }),
    [user, loading, isAuthenticated]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

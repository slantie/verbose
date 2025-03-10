"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "lucide-react";
import { Spinner } from "../ui/spinner";

interface ChatUser {
  id: string;
  username: string;
  email: string;
  isOnline?: boolean;
}

interface UserListProps {
  onSelectUser: (user: ChatUser) => void;
}

export function UserList({ onSelectUser }: UserListProps) {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const { isAuthenticated, refreshToken } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      // Check token directly from localStorage
      const token = localStorage.getItem("auth_token");

      if (!token) {
        console.log("No token in localStorage, skipping user fetch");
        setLoading(false);
        return;
      }

      try {
        console.log(
          "Fetching users with token:",
          token ? "Found token" : "No token"
        );
        const response = await fetch("http://localhost:8000/api/users", {
          credentials: "include",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUsers(data);
          console.log("Users fetched successfully:", data);
        } else if (response.status === 401) {
          console.log("Auth token expired, attempting refresh...");
          const refreshSuccessful = await refreshToken();

          if (refreshSuccessful) {
            // Retry after refresh
            fetchUsers();
          } else {
            console.error("Token refresh failed, cannot fetch users");
          }
        } else {
          console.error("Failed to fetch users:", response.status);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isAuthenticated, refreshToken]);

  return (
    // Add flex-col and h-full for proper height distribution
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <h2 className="text-xl font-semibold">Chats</h2>
      </div>
      {/* Make this flex-1 and overflow-y-auto to contain scrolling */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Spinner size="lg" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No users found</div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 ${
                selectedUser?.id === user.id
                  ? "bg-gray-50 dark:bg-gray-900"
                  : ""
              }`}
              onClick={() => {
                setSelectedUser(user);
                onSelectUser(user);
              }}
            >
              <div className="relative">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
                {user.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                )}
              </div>
              <div>
                <p className="font-medium">{user.username}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.email}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

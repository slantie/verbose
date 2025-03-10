"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { MessageInput } from "./MessageInput";
import { io, Socket } from "socket.io-client";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";
import { AnimatePresence, motion } from "framer-motion";
import { MessageActions } from "./MessageActions";

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  read: boolean;
  isEdited?: boolean;
  isDeleted?: boolean;
}

interface ChatWindowProps {
  selectedUser: {
    id: string;
    username: string;
  } | null;
}

interface OnlineUser {
  id: string;
  online: boolean;
  lastSeen?: string;
}

export function ChatWindow({ selectedUser }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const { user, refreshToken } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Setup socket connection
  useEffect(() => {
    // Only initialize socket if not already connected
    if (!socketRef.current) {
      console.log("Initializing socket connection");
      socketRef.current = io("http://localhost:8000", {
        withCredentials: true, // Enable sending cookies with requests
      });

      // Error handling
      socketRef.current.on("connect_error", (err) => {
        console.error("Socket connection error:", err);
        setError("Unable to connect to chat server. Please try again later.");
        setIsConnected(false);
      });

      socketRef.current.on("connect", () => {
        setIsConnected(true);
        setError(null);
      });

      socketRef.current.on("disconnect", () => {
        setIsConnected(false);
        setError("Connection lost. Trying to reconnect...");
      });

      // Track online users
      socketRef.current.on("userStatus", (users: OnlineUser[]) => {
        setOnlineUsers(users);
      });

      // Handle message updates and deletions
      socketRef.current.on("messageUpdated", (updatedMessage) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === updatedMessage.id ? updatedMessage : msg
          )
        );
      });

      socketRef.current.on("messageDeleted", (deletedMessage) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === deletedMessage.id ? deletedMessage : msg
          )
        );
      });

      // Handle notifications
      socketRef.current.on("newNotification", (data) => {
        // You can show a toast notification here or update a notification count
        console.log("New notification:", data);
      });
    }

    // Cleanup function to disconnect socket when component unmounts
    return () => {
      if (socketRef.current) {
        console.log("Disconnecting socket");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once

  // Handle user-specific socket events
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !user) return;

    // Join user's room
    socket.emit("join", user.id);

    // Listen for new messages
    const handleReceiveMessage = (message: Message) => {
      // Only add messages that are part of the current conversation
      if (
        selectedUser &&
        ((message.senderId === user.id &&
          message.receiverId === selectedUser.id) ||
          (message.senderId === selectedUser.id &&
            message.receiverId === user.id))
      ) {
        setMessages((prev) => [...prev, message]);

        // Mark received messages as read
        if (message.senderId === selectedUser.id && !message.read) {
          socket.emit("markAsRead", { messageId: message.id, userId: user.id });
        }
      }
    };

    // Handle typing indicator
    const handleTypingIndicator = (data: {
      userId: string;
      isTyping: boolean;
    }) => {
      if (selectedUser && data.userId === selectedUser.id) {
        setIsTyping(data.isTyping);
      }
    };

    // Handle read receipts
    const handleReadReceipt = (data: { messageId: string; userId: string }) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === data.messageId ? { ...message, read: true } : message
        )
      );
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("userTyping", handleTypingIndicator);
    socket.on("messageRead", handleReadReceipt);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("userTyping", handleTypingIndicator);
      socket.off("messageRead", handleReadReceipt);
    };
  }, [user, selectedUser]); // Removed socketRef.current from dependencies

  const handleSendMessage = async (content: string) => {
    if (!selectedUser || !content.trim() || !socketRef.current || isSending)
      return;

    setIsSending(true);
    setError(null);

    try {
      // Using HttpOnly cookies instead of manually adding token to headers
      const response = await fetch("http://localhost:8000/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies in the request
        body: JSON.stringify({
          receiverId: selectedUser.id,
          content: content.trim(),
        }),
      });

      if (response.status === 401) {
        // Token expired, attempt to refresh
        const refreshed = await refreshToken();
        if (!refreshed) {
          throw new Error("Authentication failed");
        }
        // Retry with fresh token (cookies will be sent automatically)
        const retryResponse = await fetch(
          "http://localhost:8000/api/messages",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              receiverId: selectedUser.id,
              content: content.trim(),
            }),
          }
        );

        if (!retryResponse.ok) {
          throw new Error("Failed to send message after token refresh");
        }

        const newMessage = await retryResponse.json();
        handleNewMessage(newMessage);
      } else if (!response.ok) {
        throw new Error("Failed to send message");
      } else {
        const newMessage = await response.json();
        handleNewMessage(newMessage);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // Helper function to handle new messages
  const handleNewMessage = (newMessage: Message) => {
    // Emit the created message through socket
    socketRef.current?.emit("sendMessage", {
      senderId: user?.id,
      receiverId: selectedUser?.id,
      message: newMessage,
    });

    // Update local state with the new message
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleTyping = (isCurrentlyTyping: boolean) => {
    if (!socketRef.current || !selectedUser || !user) return;

    // Send typing status to the server
    socketRef.current.emit("typing", {
      senderId: user.id,
      receiverId: selectedUser.id,
      isTyping: isCurrentlyTyping,
    });

    // Clear existing timeout if it exists
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set a new timeout to stop the typing indicator after 2 seconds
    if (isCurrentlyTyping) {
      const timeout = setTimeout(() => {
        socketRef.current?.emit("typing", {
          senderId: user.id,
          receiverId: selectedUser.id,
          isTyping: false,
        });
      }, 2000);

      setTypingTimeout(timeout);
    }
  };

  const fetchMessages = useCallback(async () => {
    if (!selectedUser || !user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Using HttpOnly cookies instead of manually adding token
      const response = await fetch(
        `http://localhost:8000/api/messages/${selectedUser.id}`,
        {
          credentials: "include", // Include cookies in the request
        }
      );

      if (response.status === 401) {
        // Token expired, attempt to refresh
        const refreshed = await refreshToken();
        if (!refreshed) {
          throw new Error("Authentication failed");
        }
        // Retry with fresh token
        const retryResponse = await fetch(
          `http://localhost:8000/api/messages/${selectedUser.id}`,
          {
            credentials: "include",
          }
        );

        if (!retryResponse.ok) {
          throw new Error("Failed to fetch messages after token refresh");
        }

        const data = await retryResponse.json();
        processMessages(data);
      } else if (!response.ok) {
        throw new Error("Failed to fetch messages");
      } else {
        const data = await response.json();
        processMessages(data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      setError("Failed to load messages. Please try again.");
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedUser, user, refreshToken]);

  // Helper function to process fetched messages
  const processMessages = (data: Message[]) => {
    // Filter messages to only include those between current user and selected user
    const filteredMessages = data.filter(
      (message: Message) =>
        (message.senderId === user?.id &&
          message.receiverId === selectedUser?.id) ||
        (message.senderId === selectedUser?.id &&
          message.receiverId === user?.id)
    );

    setMessages(filteredMessages);

    // Mark unread received messages as read
    if (socketRef.current && user) {
      const unreadMessages = filteredMessages.filter(
        (msg) => msg.senderId === selectedUser?.id && !msg.read
      );

      unreadMessages.forEach((msg) => {
        socketRef.current?.emit("markAsRead", {
          messageId: msg.id,
          userId: user.id,
        });
      });
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [selectedUser, fetchMessages]);

  const retryFetchMessages = () => {
    fetchMessages();
  };

  // Handle editing of a message
  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!socketRef.current || !user) return;
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:8000/api/messages/edit/${messageId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            content: newContent,
          }),
        }
      );

      if (response.status === 401) {
        // Token expired, attempt to refresh
        const refreshed = await refreshToken();
        if (!refreshed) {
          throw new Error("Authentication failed");
        }
        // Retry with fresh token
        const retryResponse = await fetch(
          `http://localhost:8000/api/messages/edit/${messageId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              content: newContent,
            }),
          }
        );

        if (!retryResponse.ok) {
          throw new Error("Failed to edit message after token refresh");
        }

        const updatedMessage = await retryResponse.json();

        // Also emit through socket for real-time update
        socketRef.current?.emit("editMessage", {
          messageId,
          content: newContent,
          userId: user.id,
        });

        // Update local state
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, content: newContent, isEdited: true }
              : msg
          )
        );
      } else if (!response.ok) {
        throw new Error("Failed to edit message");
      } else {
        const updatedMessage = await response.json();

        // Also emit through socket for real-time update
        socketRef.current?.emit("editMessage", {
          messageId,
          content: newContent,
          userId: user.id,
        });

        // Update local state
        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? updatedMessage : msg))
        );
      }
    } catch (error) {
      console.error("Error editing message:", error);
      setError("Failed to edit message. Please try again.");
    } finally {
      setEditingMessageId(null);
      setEditContent("");
    }
  };

  // Handle deletion of a message
  const handleDeleteMessage = async (messageId: string) => {
    if (!socketRef.current || !user) return;
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:8000/api/messages/delete/${messageId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.status === 401) {
        // Token expired, attempt to refresh
        const refreshed = await refreshToken();
        if (!refreshed) {
          throw new Error("Authentication failed");
        }
        // Retry with fresh token
        const retryResponse = await fetch(
          `http://localhost:8000/api/messages/delete/${messageId}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        if (!retryResponse.ok) {
          throw new Error("Failed to delete message after token refresh");
        }

        // Also emit through socket for real-time update
        socketRef.current?.emit("deleteMessage", {
          messageId,
          userId: user.id,
        });

        // Update local state
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, isDeleted: true, content: "This message was deleted" }
              : msg
          )
        );
      } else if (!response.ok) {
        throw new Error("Failed to delete message");
      } else {
        // Also emit through socket for real-time update
        socketRef.current?.emit("deleteMessage", {
          messageId,
          userId: user.id,
        });

        // Update local state
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, isDeleted: true, content: "This message was deleted" }
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      setError("Failed to delete message. Please try again.");
    }
  };

  // Start editing a message
  const startEditingMessage = (message: Message) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  return (
    // Use relative positioning and h-full for proper layout control
    <div className="flex flex-col h-full relative">
      {!isConnected && (
        <Alert
          variant="destructive"
          className="m-2 absolute top-0 left-0 right-0 z-10"
        >
          <p>Connection lost. Trying to reconnect...</p>
        </Alert>
      )}

      {error && (
        <Alert
          variant="destructive"
          className="m-2 absolute top-0 left-0 right-0 z-10 flex justify-between items-center"
        >
          <p>{error}</p>
          <button
            onClick={retryFetchMessages}
            className="bg-destructive/20 hover:bg-destructive/30 text-destructive-foreground px-3 py-1 rounded-md text-sm"
          >
            Retry
          </button>
        </Alert>
      )}

      {selectedUser && (
        <div className="border-b p-3 flex items-center gap-2 shrink-0">
          <span
            className={`h-3 w-3 rounded-full ${
              onlineUsers.find((u) => u.id === selectedUser.id)?.online
                ? "bg-green-500"
                : "bg-gray-400"
            }`}
          ></span>
          <span>{selectedUser.username}</span>
          <span className="text-gray-400 text-sm ml-auto">
            {!onlineUsers.find((u) => u.id === selectedUser.id)?.online &&
              onlineUsers.find((u) => u.id === selectedUser.id)?.lastSeen &&
              `Last seen: ${new Date(
                onlineUsers.find((u) => u.id === selectedUser.id)?.lastSeen ||
                  ""
              ).toLocaleString()}`}
          </span>
        </div>
      )}

      {/* Use flex-1 and overflow-auto to allow proper scrolling within this div only */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Spinner size="lg" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-gray-500">
            <p>No messages yet</p>
            <p className="text-sm">Send a message to start the conversation</p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${
                  message.senderId === user?.id
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] break-words rounded-lg px-4 py-2 ${
                    message.senderId === user?.id
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800"
                  } relative group`}
                >
                  {editingMessageId === message.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-2 rounded bg-background text-foreground border"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={cancelEditing}
                          className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() =>
                            handleEditMessage(message.id, editContent)
                          }
                          className="text-xs px-2 py-1 bg-blue-500 text-white rounded"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p
                        className={
                          message.isDeleted ? "italic text-gray-400" : ""
                        }
                      >
                        {message.content}
                      </p>
                      <div className="flex justify-between items-center text-xs opacity-70 mt-1">
                        <div className="flex items-center gap-1">
                          <span>
                            {new Date(message.createdAt).toLocaleString()}
                          </span>
                          {message.isEdited && !message.isDeleted && (
                            <span className="italic">(edited)</span>
                          )}
                        </div>
                        {message.senderId === user?.id && (
                          <span className="ml-2">
                            {message.read ? "✓✓" : "✓"}
                          </span>
                        )}
                      </div>

                      {/* Message actions (edit, delete) */}
                      {message.senderId === user?.id && !message.isDeleted && (
                        <MessageActions
                          message={message}
                          onEdit={() => startEditingMessage(message)}
                          onDelete={() => handleDeleteMessage(message.id)}
                        />
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {isTyping && selectedUser && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce delay-75">.</span>
                <span className="animate-bounce delay-150">.</span>
              </div>
              <span className="text-xs text-gray-500">
                {selectedUser.username} is typing
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Set as shrink-0 so it doesn't get compressed */}
      <div className="shrink-0">
        <MessageInput
          onSendMessage={handleSendMessage}
          isDisabled={isSending || !isConnected}
          isSending={isSending}
          onTyping={handleTyping}
          editMode={!!editingMessageId}
          editContent={editContent}
          onCancelEdit={cancelEditing}
          onEditMessage={
            editingMessageId
              ? (content) => handleEditMessage(editingMessageId, content)
              : undefined
          }
        />
      </div>
    </div>
  );
}

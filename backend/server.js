const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");
const { router: authRoutes, verifyToken } = require("./routes/auth.js");
const messageRoutes = require("./routes/messages");
const userRoutes = require("./routes/users");
const { PrismaClient } = require("@prisma/client");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});
const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(cookieParser()); // Add cookie parser middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", verifyToken, messageRoutes);
app.use("/api/users", verifyToken, userRoutes);

// Add notifications route
const notificationRoutes = require("./routes/notifications");
app.use("/api/notifications", verifyToken, notificationRoutes);

// Test protected route
app.get("/api/protected", verifyToken, (req, res) => {
  res.json({ message: "Access granted to protected route", user: req.user });
});

// Socket.io implementation
const activeUsers = new Map(); // { userId: { socketId, lastSeen } }
const userTypingStatus = new Map(); // { userId: { targetUserId: typingUntil } }

// Helper to broadcast online users
function broadcastOnlineUsers() {
  const onlineUsersList = [];

  activeUsers.forEach((data, userId) => {
    onlineUsersList.push({
      id: userId,
      online: true,
    });
  });

  io.emit("userStatus", onlineUsersList);
}

// Set up socket connection
io.on("connection", (socket) => {
  console.log(`New socket connection: ${socket.id}`);

  socket.on("join", async (userId) => {
    // Check if user already has an active connection
    if (activeUsers.has(userId)) {
      const existingSocketData = activeUsers.get(userId);
      console.log(
        `User ${userId} already connected with socket ID ${existingSocketData.socketId}`
      );

      // Disconnect previous socket if it still exists and is different
      const existingSocket = io.sockets.sockets.get(
        existingSocketData.socketId
      );
      if (existingSocket && existingSocketData.socketId !== socket.id) {
        console.log(
          `Disconnecting previous socket ${existingSocketData.socketId} for user ${userId}`
        );
        existingSocket.disconnect(true);
      }
    }

    // Update the user's socket mapping
    activeUsers.set(userId, {
      socketId: socket.id,
      lastSeen: new Date(),
    });

    socket.userId = userId; // Store userId in socket for easier cleanup
    socket.join(userId);

    console.log(
      `User ${userId} joined with socket ID ${socket.id}. Total active users: ${activeUsers.size}`
    );

    // Broadcast updated online users
    broadcastOnlineUsers();

    // Update user's last online status in the database
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { lastSeen: new Date() },
      });
    } catch (error) {
      console.error("Failed to update user last seen:", error);
    }
  });

  // Handle message sending
  socket.on("sendMessage", async (data) => {
    const { senderId, receiverId, message } = data;
    try {
      let chat = await prisma.chat.findFirst({
        where: {
          AND: [
            { users: { some: { userId: senderId } } },
            { users: { some: { userId: receiverId } } },
          ],
        },
      });

      if (!chat) {
        chat = await prisma.chat.create({
          data: {
            users: {
              create: [{ userId: senderId }, { userId: receiverId }],
            },
          },
        });
      }

      // Emit message to receiver if online
      const receiverData = activeUsers.get(receiverId);
      if (receiverData) {
        io.to(receiverData.socketId).emit("receiveMessage", message);
      }

      // Clear typing indicator when message is sent
      clearTypingStatus(senderId, receiverId);
    } catch (error) {
      console.error("Error handling message:", error);
    }
  });

  // Handle typing indicators
  socket.on("typing", (data) => {
    const { senderId, receiverId, isTyping } = data;

    // Set typing status
    if (!userTypingStatus.has(senderId)) {
      userTypingStatus.set(senderId, new Map());
    }

    const userTyping = userTypingStatus.get(senderId);

    if (isTyping) {
      // Set typing status to expire in 3 seconds
      userTyping.set(receiverId, Date.now() + 3000);
    } else {
      userTyping.delete(receiverId);
    }

    // Emit typing status to receiver if online
    const receiverData = activeUsers.get(receiverId);
    if (receiverData) {
      io.to(receiverData.socketId).emit("userTyping", {
        userId: senderId,
        isTyping,
      });
    }
  });

  // Helper function to clear typing status
  function clearTypingStatus(senderId, receiverId) {
    if (userTypingStatus.has(senderId)) {
      const userTyping = userTypingStatus.get(senderId);
      userTyping.delete(receiverId);

      // Notify receiver that typing has stopped
      const receiverData = activeUsers.get(receiverId);
      if (receiverData) {
        io.to(receiverData.socketId).emit("userTyping", {
          userId: senderId,
          isTyping: false,
        });
      }
    }
  }

  // Handle read receipts
  socket.on("markAsRead", async (data) => {
    const { messageId, userId } = data;

    try {
      // Update message as read in database
      const message = await prisma.message.update({
        where: { id: messageId },
        data: { read: true, readAt: new Date() },
      });

      // Notify sender that message was read
      const senderData = activeUsers.get(message.senderId);
      if (senderData) {
        io.to(senderData.socketId).emit("messageRead", {
          messageId,
          userId,
        });
      }
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  });

  // Handle message editing
  socket.on("editMessage", async (data) => {
    const { messageId, content, userId } = data;

    try {
      // Check if user is allowed to edit this message
      const message = await prisma.message.findUnique({
        where: { id: messageId },
      });

      if (!message || message.senderId !== userId) {
        return;
      }

      // Update the message
      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: { content, isEdited: true },
        include: { sender: true, receiver: true },
      });

      // Emit to both sender and receiver
      io.to(message.senderId).emit("messageUpdated", updatedMessage);
      io.to(message.receiverId).emit("messageUpdated", updatedMessage);

      // Create notification for receiver
      await prisma.notification.create({
        data: {
          userId: message.receiverId,
          message: `${updatedMessage.sender.username} edited a message`,
        },
      });

      // Send notification to receiver if online
      const receiverData = activeUsers.get(message.receiverId);
      if (receiverData) {
        io.to(receiverData.socketId).emit("newNotification", {
          message: `${updatedMessage.sender.username} edited a message`,
        });
      }
    } catch (error) {
      console.error("Error handling message edit:", error);
    }
  });

  // Handle message deletion
  socket.on("deleteMessage", async (data) => {
    const { messageId, userId } = data;

    try {
      // Check if user is allowed to delete this message
      const message = await prisma.message.findUnique({
        where: { id: messageId },
      });

      if (!message || message.senderId !== userId) {
        return;
      }

      // Soft delete the message
      const deletedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
          isDeleted: true,
          content: "This message was deleted",
        },
        include: { sender: true, receiver: true },
      });

      // Emit to both sender and receiver
      io.to(message.senderId).emit("messageDeleted", deletedMessage);
      io.to(message.receiverId).emit("messageDeleted", deletedMessage);

      // Create notification for receiver
      await prisma.notification.create({
        data: {
          userId: message.receiverId,
          message: `${deletedMessage.sender.username} deleted a message`,
        },
      });

      // Send notification to receiver if online
      const receiverData = activeUsers.get(message.receiverId);
      if (receiverData) {
        io.to(receiverData.socketId).emit("newNotification", {
          message: `${deletedMessage.sender.username} deleted a message`,
        });
      }
    } catch (error) {
      console.error("Error handling message deletion:", error);
    }
  });

  // Add notification listener
  socket.on("sendNotification", async (data) => {
    const { userId, message } = data;

    try {
      // Create notification in database
      await prisma.notification.create({
        data: {
          userId,
          message,
        },
      });

      // Send to user if online
      const userData = activeUsers.get(userId);
      if (userData) {
        io.to(userData.socketId).emit("newNotification", { message });
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  });

  // Handle disconnect
  socket.on("disconnect", async () => {
    const userId = socket.userId;
    if (userId) {
      // Only update if this socket is still the active one for this user
      if (
        activeUsers.has(userId) &&
        activeUsers.get(userId).socketId === socket.id
      ) {
        const lastSeen = new Date();

        // Update last seen in database
        try {
          await prisma.user.update({
            where: { id: userId },
            data: { lastSeen },
          });
        } catch (error) {
          console.error(
            "Failed to update user last seen on disconnect:",
            error
          );
        }

        // Keep the user in activeUsers map but mark as offline
        activeUsers.delete(userId);

        console.log(
          `User ${userId} disconnected. Socket: ${socket.id}. Remaining active users: ${activeUsers.size}`
        );

        // Broadcast updated user status
        broadcastOnlineUsers();

        // Clear typing status
        if (userTypingStatus.has(userId)) {
          userTypingStatus.delete(userId);
        }
      }
    } else {
      console.log(`Socket disconnected without user ID: ${socket.id}`);
      // Clean up any orphaned socket entries
      activeUsers.forEach((data, key) => {
        if (data.socketId === socket.id) {
          activeUsers.delete(key);
          console.log(`Removed orphaned socket mapping for user ${key}`);
        }
      });
    }
  });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

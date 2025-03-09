const express = require("express");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();
const prisma = new PrismaClient();

// Send a message
router.post("/send", async (req, res) => {
  try {
    const { chatId, senderId, content, type, attachment, parentId } = req.body;

    const message = await prisma.message.create({
      data: {
        chatId,
        senderId,
        content,
        type,
        attachment: attachment ? { create: attachment } : undefined,
        parentId,
      },
      include: { sender: true, attachment: true, reactions: true },
    });

    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get messages for a chat
router.get("/chat/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;
    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
      include: { sender: true, attachment: true, reactions: true },
    });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit a message
router.put("/edit/:messageId", async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const { userId } = req.user;

    // First check if the user is the sender of this message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { sender: true, receiver: true, chat: true },
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.senderId !== userId) {
      return res
        .status(403)
        .json({ message: "You can only edit your own messages" });
    }

    // Check if message is too old (e.g., > 24 hours)
    const messageTime = new Date(message.createdAt).getTime();
    const currentTime = new Date().getTime();
    const hoursSinceCreation = (currentTime - messageTime) / (1000 * 60 * 60);

    if (hoursSinceCreation > 24) {
      return res
        .status(400)
        .json({ message: "Cannot edit messages older than 24 hours" });
    }

    // Update the message
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { content, isEdited: true },
      include: { sender: true, receiver: true },
    });

    // Emit socket event to notify both users about the edit
    if (req.app.get("io")) {
      const io = req.app.get("io");
      io.to(message.senderId).emit("messageUpdated", updatedMessage);
      io.to(message.receiverId).emit("messageUpdated", updatedMessage);
    }

    // Create notification for the receiver
    await prisma.notification.create({
      data: {
        userId: message.receiverId,
        message: `${message.sender.username} edited a message`,
      },
    });

    res.status(200).json(updatedMessage);
  } catch (error) {
    console.error("Error editing message:", error);
    res.status(500).json({ message: "Failed to edit message" });
  }
});

// Delete a message
router.delete("/delete/:messageId", async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.user;

    // First check if the user is the sender of this message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { sender: true, receiver: true },
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.senderId !== userId) {
      return res
        .status(403)
        .json({ message: "You can only delete your own messages" });
    }

    // Check if message is too old (e.g., > 24 hours)
    const messageTime = new Date(message.createdAt).getTime();
    const currentTime = new Date().getTime();
    const hoursSinceCreation = (currentTime - messageTime) / (1000 * 60 * 60);

    if (hoursSinceCreation > 24) {
      return res
        .status(400)
        .json({ message: "Cannot delete messages older than 24 hours" });
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

    // Emit socket event to notify both users about the deletion
    if (req.app.get("io")) {
      const io = req.app.get("io");
      io.to(message.senderId).emit("messageDeleted", deletedMessage);
      io.to(message.receiverId).emit("messageDeleted", deletedMessage);
    }

    // Create notification for the receiver
    await prisma.notification.create({
      data: {
        userId: message.receiverId,
        message: `${message.sender.username} deleted a message`,
      },
    });

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ message: "Failed to delete message" });
  }
});

// Get pinned messages for a chat
router.get("/pinned/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;
    const pinnedMessages = await prisma.pinnedMessage.findMany({
      where: { chatId },
      include: { message: true },
    });
    res.status(200).json(pinnedMessages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get messages between current user and another user
router.get("/:receiverId", async (req, res) => {
  try {
    const { userId } = req.user;
    const { receiverId } = req.params;

    // Get all messages between these two users
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            senderId: userId,
            receiverId: receiverId,
          },
          {
            senderId: receiverId,
            receiverId: userId,
          },
        ],
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

// Send a new message
router.post("/", async (req, res) => {
  try {
    const { userId } = req.user;
    const { receiverId, content } = req.body;

    // First find or create a chat between these users
    let chat = await prisma.chat.findFirst({
      where: {
        AND: [
          { users: { some: { userId } } },
          { users: { some: { userId: receiverId } } },
        ],
      },
    });

    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          users: {
            create: [{ userId }, { userId: receiverId }],
          },
        },
      });
    }

    // Create the message with chat relation - using only connect relationships
    const message = await prisma.message.create({
      data: {
        content,
        type: "TEXT",
        status: "SENT",
        read: false,
        sender: {
          connect: { id: userId },
        },
        receiver: {
          connect: { id: receiverId },
        },
        chat: {
          connect: { id: chat.id },
        },
      },
      include: {
        sender: true,
        receiver: true,
      },
    });

    // Update last message in chat
    await prisma.chat.update({
      where: { id: chat.id },
      data: {
        lastMessageId: message.id,
        updatedAt: new Date(),
      },
    });

    // Emit socket event to both sender and receiver
    if (req.app.get("io")) {
      const io = req.app.get("io");
      io.to(userId).emit("receiveMessage", message);
      io.to(receiverId).emit("receiveMessage", message);
    }

    res.status(201).json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
});

module.exports = router;

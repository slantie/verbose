const express = require("express");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();
const prisma = new PrismaClient();

// Get all notifications for current user
router.get("/", async (req, res) => {
  try {
    const { userId } = req.user;

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// Mark notification as read
router.put("/:notificationId/read", async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.user;

    // First check if notification belongs to this user
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Mark as read
    const updatedNotification = await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        isRead: true,
      },
    });

    res.status(200).json(updatedNotification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Failed to update notification" });
  }
});

// Mark all notifications as read
router.put("/read-all", async (req, res) => {
  try {
    const { userId } = req.user;

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Failed to update notifications" });
  }
});

// Delete a notification
router.delete("/:notificationId", async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.user;

    // First check if notification belongs to this user
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Delete the notification
    await prisma.notification.delete({
      where: {
        id: notificationId,
      },
    });

    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Failed to delete notification" });
  }
});

module.exports = router;

const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { verifyToken } = require("./auth");

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", verifyToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        verified: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

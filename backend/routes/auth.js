const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
require("dotenv").config();

const router = express.Router();
const prisma = new PrismaClient();

// Secret keys
const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "your_access_token_secret";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "your_refresh_token_secret";

// Token expiration times
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days

// Cookie settings
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

// Generate tokens
function generateTokens(userId) {
  const accessToken = jwt.sign({ userId }, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
  const refreshToken = jwt.sign({ userId }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
  return { accessToken, refreshToken };
}

// Email Transporter (Nodemailer)
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate OTP
const generateOTP = () => crypto.randomInt(100000, 999999).toString();

// Verify Token Middleware
const verifyToken = (req, res, next) => {
  // Get token from cookie or Authorization header
  let token = req.cookies.access_token;

  // Check Authorization header if token not in cookies
  const authHeader = req.headers.authorization;
  if (!token && authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
    console.log("Using token from Authorization header");
  }

  console.log("Verifying token:", token ? "Token exists" : "No token");

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const verified = jwt.verify(token, ACCESS_TOKEN_SECRET);
    req.user = verified;
    console.log("Token verified successfully for user:", req.user.userId);
    next();
  } catch (error) {
    console.error("Token verification error:", error.message);
    res.status(401).json({ message: "Invalid token" });
  }
};

// Check Auth Status Route
router.get("/check-auth", verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, username: true, email: true },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ message: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const otpCode = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.oTP.upsert({
      where: { email },
      update: { code: otpCode, expiresAt: otpExpiry },
      create: { email, code: otpCode, expiresAt: otpExpiry },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify your email - Chat App",
      text: `Your OTP code is ${otpCode}. It is valid for 10 minutes.`,
    });

    await prisma.user.create({
      data: { username, email, password: hashedPassword, verified: false },
    });

    res.status(200).json({ message: "OTP sent to email. Please verify." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await prisma.oTP.findUnique({ where: { email } });

    if (!otpRecord || otpRecord.code !== otp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    await prisma.user.update({
      where: { email },
      data: { verified: true },
    });

    await prisma.oTP.delete({ where: { email } });

    res.status(200).json({ message: "Email verified. You can now log in." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register endpoint
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Set cookies
    res.cookie("access_token", accessToken, COOKIE_OPTIONS);
    res.cookie("refresh_token", refreshToken, COOKIE_OPTIONS);

    // Return user data (without password)
    const { password: _, ...userData } = user;
    res.status(201).json({
      user: userData,
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate that email exists in the request body
    if (!email) {
      console.log("Login attempt with missing email:", req.body);
      return res.status(400).json({ message: "Email is required" });
    }

    console.log(`Login attempt for email: ${email}`);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Validate password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Store refresh token in database
    await prisma.refreshToken.upsert({
      where: { userId: user.id },
      update: {
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      create: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Set both cookies and include tokens in response body
    res.cookie("access_token", accessToken, COOKIE_OPTIONS);
    res.cookie("refresh_token", refreshToken, COOKIE_OPTIONS);

    // Return user data and tokens (without password)
    const { password: _, ...userData } = user;
    res.status(200).json({
      user: userData,
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// Logout endpoint
router.post("/logout", (req, res) => {
  // Clear cookies
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");

  res.status(200).json({ message: "Logged out successfully" });
});

// Token refresh endpoint
router.post("/refresh", async (req, res) => {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    // Verify refresh token
    let payload;
    try {
      payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    } catch (err) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Check if token exists in database
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        userId: payload.userId,
        token: refreshToken,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedToken) {
      return res.status(403).json({ message: "Refresh token is not valid" });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate new tokens
    const newTokens = generateTokens(user.id);

    // Update refresh token in database
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        token: newTokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Set new cookies
    res.cookie("access_token", newTokens.accessToken, COOKIE_OPTIONS);
    res.cookie("refresh_token", newTokens.refreshToken, COOKIE_OPTIONS);

    // Return user data
    const { password: _, ...userData } = user;
    res.status(200).json({ user: userData });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({ message: "Server error during token refresh" });
  }
});

// Get current user endpoint
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password: _, ...userData } = user;
    res.status(200).json(userData);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = { router, verifyToken };

import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { serializeUser } from "../utils/serializers.js";
import { rateLimit } from "../middleware/rateLimiter.js";

const router = express.Router();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
const normalizeEmail = (value = "") => String(value).trim().toLowerCase();
const normalizeName = (value = "") => String(value).trim().replace(/\s+/g, " ");
const normalizePhone = (value = "") => String(value).trim();
const isValidEmail = (value = "") => EMAIL_REGEX.test(normalizeEmail(value));
const isValidPassword = (value = "") => String(value).length >= MIN_PASSWORD_LENGTH;
const normalizePublicRole = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();

  if (!normalized || normalized === "client" || normalized === "customer" || normalized === "user") {
    return "customer";
  }

  if (normalized === "vendor") {
    return "vendor";
  }

  return null;
};
const buildStoreSlug = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
const ensureUniqueStoreSlug = async (candidate) => {
  const fallback = `shop-${Date.now()}`;
  const baseSlug = buildStoreSlug(candidate) || fallback;
  let slug = baseSlug;
  let suffix = 2;

  while (await User.findOne({ where: { storeSlug: slug } })) {
    const nextSlug = `${baseSlug}-${suffix}`;
    slug = nextSlug.slice(0, 80);
    suffix += 1;
  }

  return slug;
};

const registerRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => `${req.ip}:register`,
});

const loginRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 12,
  keyGenerator: (req) => `${req.ip}:login:${normalizeEmail(req.body?.email || "")}`,
});

router.post("/register", registerRateLimiter, async (req, res) => {
  const name = normalizeName(req.body?.name || "");
  const email = normalizeEmail(req.body?.email || "");
  const phone = normalizePhone(req.body?.phone || "");
  const password = String(req.body?.password || "");
  const role = normalizePublicRole(req.body?.role || "customer");

  if (name.length < 2) {
    return res.status(400).json({ message: "Name must be at least 2 characters" });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Valid email is required" });
  }

  if (!isValidPassword(password)) {
    return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }

  if (phone.length < 6) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  if (!role) {
    return res.status(400).json({ message: "Only client and vendor accounts can be created here" });
  }

  try {
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ message: "Email exists" });

    const payload = {
      name,
      email,
      phone,
      password,
      role,
    };

    if (role === "vendor") {
      payload.storeName = name;
      payload.storeSlug = await ensureUniqueStoreSlug(name);
      payload.businessPhone = phone;
    }

    const user = await User.create(payload);
    const safeUser = serializeUser(user);

    res.status(201).json({
      _id: safeUser._id,
      name: safeUser.name,
      email: safeUser.email,
      phone: safeUser.phone,
      role: safeUser.role,
      createdAt: safeUser.createdAt,
      token: generateToken(safeUser._id),
    });
  } catch (err) {
    console.error("Registration failed:", err.message);
    res.status(500).json({ message: "We could not create the account right now" });
  }
});

router.post("/login", loginRateLimiter, async (req, res) => {
  const email = normalizeEmail(req.body?.email || "");
  const password = String(req.body?.password || "");

  if (!isValidEmail(email) || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.active) {
      return res.status(403).json({ message: "Account suspended" });
    }

    if (await user.matchPassword(password)) {
      const safeUser = serializeUser(user);
      res.json({
        _id: safeUser._id,
        name: safeUser.name,
        email: safeUser.email,
        phone: safeUser.phone,
        role: safeUser.role,
        createdAt: safeUser.createdAt,
        token: generateToken(safeUser._id),
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (err) {
    console.error("Login failed:", err.message);
    res.status(500).json({ message: "We could not sign you in right now" });
  }
});

export default router;

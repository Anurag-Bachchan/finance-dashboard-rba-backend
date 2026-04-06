const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const SALT_ROUNDS = 10;
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "token";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function cookieMaxAgeMs() {
  const match = /^(\d+)([dhms])$/.exec(JWT_EXPIRES_IN.trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const n = Number(match[1]);
  const u = match[2];
  const mult = { d: 86400000, h: 3600000, m: 60000, s: 1000 };
  return n * (mult[u] || 86400000);
}

function signToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: cookieMaxAgeMs(),
    path: "/",
  });
}

async function signup(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ ok: false, message: "name, email, and password are required" });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ ok: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      password: hashedPassword,
      ...(role !== undefined && role !== null ? { role } : {}),
    });

    const token = signToken(user);
    setAuthCookie(res, token);

    return res.status(201).json({
      ok: true,
      message: "Signed up successfully",
      user: user.toJSON(),
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ ok: false, message: "Email already registered" });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ ok: false, message: err.message });
    }
    console.error(err);
    return res.status(500).json({ ok: false, message: "Something went wrong" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, message: "email and password are required" });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select("+password");
    if (!user) {
      return res.status(401).json({ ok: false, message: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ ok: false, message: "Invalid email or password" });
    }

    if (user.status !== "active") {
      return res.status(403).json({ ok: false, message: "Account is inactive" });
    }

    const token = signToken(user);
    setAuthCookie(res, token);

    const safeUser = user.toObject();
    delete safeUser.password;

    return res.json({
      ok: true,
      message: "Logged in successfully",
      user: safeUser,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Something went wrong" });
  }
}

module.exports = { signup, login, COOKIE_NAME };

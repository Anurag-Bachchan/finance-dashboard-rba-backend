const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { COOKIE_NAME } = require("../controllers/authController");

function getTokenFromRequest(req) {
  const fromCookie = req.cookies?.[COOKIE_NAME];
  if (fromCookie) return fromCookie;

  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.startsWith("Bearer ")) {
    return auth.slice(7).trim();
  }

  return null;
}

/** Verifies JWT, loads user from DB, sets req.user. Use before role checks. */
async function authenticate(req, res, next) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ ok: false, message: "Authentication required" });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const message = err.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
      return res.status(401).json({ ok: false, message });
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ ok: false, message: "User not found" });
    }

    if (user.status !== "active") {
      return res.status(403).json({ ok: false, message: "Account is inactive" });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      status: user.status,
      createdAt: user.createdAt,
    };

    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Something went wrong" });
  }
}

/**
 * Restrict route to users whose role is in allowedRoles.
 * Admin is included in analyst presets so admins retain access to analyst-only areas.
 * @param {...string} allowedRoles — e.g. authorize("admin"), authorize("admin", "analyst")
 */
function authorize(...allowedRoles) {
  const allowed = allowedRoles.flat();
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ ok: false, message: "Authentication required" });
    }
    if (allowed.length === 0) {
      return next();
    }
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ ok: false, message: "You do not have permission to access this resource" });
    }
    next();
  };
}

const requireAdmin = authorize("admin");
/** Admin or analyst (typical for analyst dashboards; admins can always access). */
const requireAnalyst = authorize("admin", "analyst");
/** Any authenticated user with a valid role (all three in your schema). */
const requireAnyRole = authorize("admin", "analyst", "user");
const requireUser = authorize("user");

module.exports = {
  authenticate,
  authorize,
  requireAdmin,
  requireAnalyst,
  requireAnyRole,
  requireUser,
};

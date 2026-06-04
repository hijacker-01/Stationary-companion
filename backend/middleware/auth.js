const jwt = require("jsonwebtoken");

exports.protect = (req, res, next) => {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && parts[1] !== "null") token = parts[1];
  }
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, permissions }
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

exports.requirePermission = (permission) => {
  return (req, res, next) => {
    const user = req.user;
    if (user.role === "admin" || (user.permissions && (user.permissions.includes("*") || user.permissions.includes(permission)))) {
      return next();
    }
    return res.status(403).json({ error: `Permission denied. Requires: ${permission}` });
  };
};

exports.adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};
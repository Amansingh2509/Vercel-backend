const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  console.log(
    "AuthMiddleware: Incoming request to",
    req.method,
    req.originalUrl
  );
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("AuthMiddleware: No token provided or malformed header");
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  console.log("AuthMiddleware: Token received:", token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("AuthMiddleware: Token decoded successfully:", decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.log("AuthMiddleware: Invalid token:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authMiddleware;

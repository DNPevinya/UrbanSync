const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: "Access denied. No token provided." });
    }

    try {
        const secret = process.env.JWT_SECRET || 'urbansync_default_secret';
        const decoded = jwt.verify(token, secret);
        
        req.user = decoded;
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error.message);
        return res.status(403).json({ success: false, message: "Invalid or expired token." });
    }
};

module.exports = authMiddleware;

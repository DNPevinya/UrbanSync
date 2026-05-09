// This middleware checks if the logged-in user has the correct role
const authorize = (allowedRoles) => {
    return (req, res, next) => {
        // 1. Check if they have a badge at all
        if (!req.user || !req.user.role) {
            return res.status(401).json({ 
                success: false, 
                message: "Unauthorized: User role not found." 
            });
        }

        // 2. THE MASTER KEY FIX: If they are a super_admin, let them through immediately!
        if (req.user.role === 'super_admin') {
            return next();
        }

        // 3. For everyone else (like officers), check if they match the allowed list
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: "Forbidden: You do not have permission to access this resource." 
            });
        }

        // If they pass, let them through
        next();
    };
};

module.exports = { authorize };
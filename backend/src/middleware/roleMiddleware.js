// This middleware checks if the logged-in user has the correct role
const authorize = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ 
                success: false, 
                message: "Unauthorized: User role not found." 
            });
        }

        if (req.user.role === 'super_admin') {
            return next();
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: "Forbidden: You do not have permission to access this resource." 
            });
        }

        next();
    };
};

module.exports = { authorize };
/**
 * Middleware strictly enforcing Role-Based Access Control (RBAC) securely natively structurally.
 * It assumes `req.dbUser` is already populated by `auth.middleware.js`.
 */
const requireAdmin = (req, res, next) => {
    if (!req.dbUser || !req.dbUser.isAdmin) {
        return res.status(403).json({ error: '🚫 Admin ruxsati talab qilinadi. Kirish rad etildi.' });
    }
    next();
};

const requireCourier = (req, res, next) => {
    if (!req.dbUser || (!req.dbUser.isCourier && !req.dbUser.isAdmin)) {
        return res.status(403).json({ error: '🚫 Kuryer ruxsati talab qilinadi. Kirish rad etildi.' });
    }
    next();
};

module.exports = {
    requireAdmin,
    requireCourier
};

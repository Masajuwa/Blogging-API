const userModel = require("../models/user");
const jwt = require("jsonwebtoken")

const authenticateJWT = (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.id }
        next();
    } catch (err) {
        res.status(403).json({ message: 'Forbidden: Invalid token' });
    }

};


module.exports = authenticateJWT
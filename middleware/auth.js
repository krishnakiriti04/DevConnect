const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function(req, res, next) {
    //get token from req headers
    const token = req.header('x-auth-token');

    //check if not token
    if (!token) {
        return res.status(401).json({ msg: "Token missing, Authorization denied" });
    }

    //verify token
    try {
        const decoded = jwt.verify(token, config.get('jwtSecret'));
        req.user = decoded.user;
        next();
    } catch (error) {
        res.status(401).json({ msg: 'Invalid Token' })
    }
}
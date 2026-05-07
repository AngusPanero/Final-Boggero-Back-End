const auth = require("../config/firebase");
const esProduccion = (process.env.NODE_ENV === 'production');

const adminMiddleware = async (req, res, next) => {
    const token = req.cookies.idToken; 

    if (!token) {
        return res.status(401).json({ message: "No credentials! 🔴" });
    }
    try {
        const decodedClaims = await auth.verifyIdToken(token);
        
        if (decodedClaims.admin === true) {
            req.user = decodedClaims;
            next();
        } else {
            return res.status(403).json({ message: "ACCESS_DENIED: ADMIN_ONLY_ZONE 🔴" });
        }
    } catch (error) {
        console.error(esProduccion ? `Unauthorized! 🔴` : `Unauthorized! 🔴 ${error}`);
        return res.status(401).json({ message: "Unauthorized" });
    }
};

module.exports = adminMiddleware;
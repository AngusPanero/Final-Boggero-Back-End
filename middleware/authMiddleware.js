const auth = require("../config/firebase")

const esProduccion = (process.env.NODE_ENV === 'production');

const verifyToken = async (req, res, next) => {
    try {
        const token = 
        req.cookies?.idToken || // NAVEGADOR
        req.headers.authorization?.split(" ")[1]; // POSTMAN

        if(!token){
            return res.status(401).json({ message: "No credentials! 🔴" })
        }

        const decoded = await auth.verifyIdToken(token)
        req.user = decoded // Le doy al user las custom claims verificadas

        next()
    } catch (error) {
        console.error(esProduccion ? `Unauthorized! 🔴`: `Unauthorized! 🔴 ${error}`);
        return res.status(401).json({ message: "Unauthorized" });
    }
}

module.exports = verifyToken
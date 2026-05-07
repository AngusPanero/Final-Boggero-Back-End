// backend/routes/adminRoutes.js
const express = require("express");
const firebaseRouter = express.Router();
const auth = require("../config/firebase"); // Tu configuración de firebase-admin
// Importa tus middlewares de seguridad
const verifyToken = require("../middleware/authMiddleware"); 
const adminMiddleware = require("../middleware/adminMiddleware");

const esProduccion = (process.env.NODE_ENV === 'production');

firebaseRouter.get("/admin/users", adminMiddleware, async (req, res) => {
    try {
        // Listamos hasta 1000 usuarios
        const listUsersResult = await auth.listUsers(1000);
        
        // Mapeamos solo la data necesaria para no exponer info sensible extra
        const users = listUsersResult.users.map(userRecord => ({
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName || "ANONYMOUS_USER",
            photoURL: userRecord.photoURL,
            metadata: {
                creationTime: userRecord.metadata.creationTime,
                lastSignInTime: userRecord.metadata.lastSignInTime,
            },
            // Verificamos si tiene el claim de banned
            isBanned: userRecord.customClaims?.banned || false,
            isAdmin: userRecord.customClaims?.admin || false
        }));

        res.status(200).json(users);
    } catch (error) {
        console.error(esProduccion ? "Error listing users! 🔴" : "Error listing users: 🔴", error);
        res.status(500).json({ message: "INTERNAL_SERVER_ERROR_FETCHING_USERS 🔴" });
    }
});

module.exports = firebaseRouter;
// Express y Router
const express = require("express")
const authRouter = express.Router()
// Firebase
const auth = require("../config/firebase")
// Models
const Audit = require("../models/AuditSchema")
// Middlewares
const loginLimiter = require("../middleware/rateLimitMiddleware")
const checkBanned = require("../middleware/checkBanned")
const verifyToken = require("../middleware/authMiddleware")
const adminMiddleware = require("../middleware/adminMiddleware")

// Axios
const axios = require("axios")

const esProduccion = (process.env.NODE_ENV === 'production');

authRouter.post("/register", async (req, res) => {
    const { email, password } = req.body
    
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
    try {
        if(!email || !password){
            return res.status(400).json({ message: "All fields are required to create an user! 🔴" })
        }

        if (!regex.test(password)) {
            return res.status(400).json({ message: "Password does not meet security requirements! 🔴" });
        }

        await auth.createUser({ email, password })
        
        return res.status(201).send({ message: `User created successfully! 🟢` })
    } catch (error) {
        if (error.code === 'auth/email-already-exists') {
            return res.status(409).json({ 
                message: "This email is already registered! 🔴" 
            });
        }
        console.error(esProduccion ? `Error creating user! 🔴` : `Error creating user! 🔴 ${error}`);
        res.status(500).send({ message: `Error creating user! 🔴` })
    }
})

authRouter.post("/login", loginLimiter, async (req, res) => {
    const { email, password } = req.body; 

    try {
        // 1. Validar credenciales contra la API de Firebase Auth
        const firebaseResponse = await axios.post(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
            { email, password, returnSecureToken: true }
        );

        const { idToken, localId: uid } = firebaseResponse.data;

        // 2. Verificar el token obtenido y obtener claims
        const decoded = await auth.verifyIdToken(idToken);

        // 3. Control de Baneo (Lógica de negocio)
        if (decoded.banned) {
            return res.status(403).json({ code: "auth/user-banned", message: "User is banned" });
        }

        // 4. Limpiar intentos fallidos y Auditar
        await Audit.findOneAndUpdate(
            { email: decoded.email, event: "login-failed" },
            { $set: { attempts: 0, lastAttemptAt: null } }
        );

        await Audit.create({
            uid: uid,
            email: decoded.email,
            event: "login",
            ip: req.ip,
            userAgent: req.headers["user-agent"]
        });

        res.cookie("idToken", idToken, {
            httpOnly: true,
            sameSite: "lax",
            secure: true,
            domain: ".boggeropropiedades.com.ar",
            maxAge: 60 * 60 * 1000,
            path: "/"
        });

        /* res.cookie("idToken", idToken, {
            httpOnly: true,
            sameSite: "none",
            secure: true,
            path: "/" 
        }); */

        // Enviamos los datos necesarios para el setUser del front
        return res.status(200).json({ 
            user: decoded, 
            idToken,
            isAdmin: decoded.admin === true 
        });

    } catch (error) {
        const errorCode = error.response?.data?.error?.message;
        
        if (
            errorCode === "INVALID_PASSWORD" || 
            errorCode === "EMAIL_NOT_FOUND" || 
            errorCode === "INVALID_LOGIN_CREDENTIALS"
        ) {
            return res.status(401).json({ code: "auth/invalid-credential" });
        }
        
        console.error(esProduccion ? "Login Error" :"Login Error:", errorCode || error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

authRouter.post("/logout", async (req, res) => {
    const { idToken } = req.body
    try {
        if(idToken){
            const decoded = await auth.verifyIdToken(idToken)
            // Audito el logout
            await Audit.create({
                uid: decoded.uid,
                email: decoded.email,
                event: "logout",
                ip: req.ip,
                userAgent: req.headers["user-agent"]
            })
        }
        // Limpio Cookie
        res.clearCookie("idToken", {
            httpOnly: true,
            sameSite: "lax",
            secure: true,
            domain: ".boggeropropiedades.com.ar",
            path: "/" 
        });

        /* res.clearCookie("idToken", {
            httpOnly: true,
            sameSite: "none",
            secure: true,
            path: "/" 
        }); */

        return res.status(200).json({ message: "Logout audited! 🟢" })
    } catch (error) {
        console.error(esProduccion ? `Logout fallback! 🔴` : `Logout fallback! 🔴 ${error}`);
        return res.status(200).json({ message: "Logout fallback! 🟡" });
        // Devuelvo 200 opr UX para no confundir al front y borrar token cuando no se deslogueo bien
    }
})

authRouter.post("/login-failed", async (req, res) => {
    const { email } = req.body
    console.log("Auditing failed login for email:", email);
    if(!email){
            return res.status(400).json({ message: "Email is required to audit failed login! 🔴" })
        }
    try {
        const now = Date.now()
        const attempt = await Audit.findOneAndUpdate(
            { email, event: "login-failed" },
            {
                $inc: { attempts: 1 },
                $set: { lastAttemptAt: now }
            },
            { upsert: true, new: true } // Esto si no existe lo creó aca
        )
        if(attempt.attempts >= 5){
            const user = await auth.getUserByEmail(email)

            await auth.setCustomUserClaims(user.uid, {
                banned: true,
                bannedAt: now,
                bannedReason: "Too many failed login attempts"
            })
            await auth.revokeRefreshTokens(user.uid) // Borro todos sus tokens existentes
            return res.status(200).json({ message: "User banned due to too many failed attempts! 🔴", banned: true })
        }
        return res.status(200).json({ message: "Failed login attempt recorded! 🟡", attempts: attempt.attempts })
    } catch (error) {
        console.error(esProduccion ? `Error auditing failed login 🔴` : `Error auditing failed login 🔴 ${error}`);
        return res.status(500).json({ message: "Error auditing failed login! 🔴" });  
    }
})

authRouter.post("/admin/ban-user", adminMiddleware, async (req, res) => {
    const { email } = req.body
    if(!email){
            return res.status(400).json({ message: "Email is required to audit failed login! 🔴" })
        }
    try {
        const now = Date.now()
        
      
        const user = await auth.getUserByEmail(email)

        await auth.setCustomUserClaims(user.uid, {
            banned: true,
            bannedAt: now,
            bannedReason: "Banned directly by admin."
        })
        await auth.revokeRefreshTokens(user.uid) // Borro todos sus tokens existentes

        return res.status(200).json({ message: "User banned successfully! 🟢",})
    } catch (error) {
        console.error(esProduccion ? `Error auditing failed login 🔴` : `Error auditing failed login 🔴 ${error}`);
        return res.status(500).json({ message: "Error auditing failed login! 🔴" });  
    }
})

authRouter.post("/unban-user", adminMiddleware, async (req, res) => {
    const { uid } = req.body
    if(!uid){
            return res.status(400).json({ message: "User UID is required! 🔴" })
        }
    try {
        const user = await auth.getUser(uid)
        await auth.setCustomUserClaims(uid, { banned: false })

        await auth.revokeRefreshTokens(uid)

        // Reseteo attempts
        await Audit.findOneAndUpdate(
            { uid, event: "login-failed" },
            { $set: { attempts: 0, lastAttemptAt: null } }
        )
        // Audito el unban
        await Audit.create({
            uid,
            email: user.email,
            event: "forced_logout",
            metadata: {
                action: "unban",
                by: "admin"
            }
            });
        return res.status(200).json({ message: "User unbanned successfully! 🟢"});

    } catch (error) {
        console.error(esProduccion ? `Error unbanning user! 🔴` : `Error unbanning user! 🔴 ${error}`);
        return res.status(500).json({ message: "Error unbanning user! 🔴" });
    }
})

authRouter.get("/check-auth", verifyToken, async (req, res) => {
    const idToken = req.cookies.idToken;

    if (!idToken) {
        return res.status(401).json({ authenticated: false });
    }

    try {
        const decoded = await auth.verifyIdToken(idToken);
        return res.status(200).json({ 
            authenticated: true, 
            user: decoded,
            isAdmin: decoded.admin === true 
        });
    } catch (error) {
        return res.status(401).json({ authenticated: false });
    }
});

authRouter.get("/me", verifyToken, checkBanned, async (req, res) => {
    const idToken = req.cookies.idToken; 

    if (!idToken) return res.status(401).json({ message: "No token" });
    try {
        const decoded = await auth.verifyIdToken(idToken);
        
        if (decoded.banned) {
            return res.status(403).json({ message: "Banned" });
        }
        return res.status(200).json({ user: decoded });
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
});

module.exports = authRouter
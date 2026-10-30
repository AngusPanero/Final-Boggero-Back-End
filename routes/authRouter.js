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
const { ipGuard, strikeIp } = adminMiddleware // Corta pedidos de IPs bloqueadas por intentos de intrusión
// Firma de 4 dígitos (mismo signPin.js que en los otros proyectos: scrypt + pepper + timingSafeEqual)
const { verifyPin, PIN_REGEX } = require("../utils/signPin")

// Axios
const axios = require("axios")

const esProduccion = (process.env.NODE_ENV === 'production');

// ─── Cookie de sesión ─────────────────────────────────────────────────────────
const COOKIE_BASE = esProduccion
    ? { httpOnly: true, sameSite: "lax",  secure: true, domain: ".boggeropropiedades.com.ar", path: "/" }
    : { httpOnly: true, sameSite: "none", secure: true, path: "/" };

const SESSION_MAX_AGE = 60 * 60 * 1000; // 1 h (lo mismo que dura el idToken de Firebase)

// ─── Firma de login ───────────────────────────────────────────────────────────
const PIN_MAX_ATTEMPTS = 5;               // Firmas incorrectas seguidas por email
const PIN_LOCK_MS      = 15 * 60 * 1000;  // Bloqueo de 15 minutos al llegar al máximo

authRouter.post("/register", ipGuard, async (req, res) => {
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

authRouter.post("/login", ipGuard, loginLimiter, async (req, res) => {
    const { email, password, pin } = req.body || {};

    // 0. Tipos: solo strings (evita inyección NoSQL tipo {"$ne": null} en el email)
    if (typeof email !== "string" || typeof password !== "string" || typeof pin !== "string" ||
        !email || !password || email.length > 254 || password.length > 128) {
        return res.status(400).json({ message: "All fields are required! 🔴" });
    }
    if (!PIN_REGEX.test(pin)) {
        return res.status(400).json({ message: "La firma tiene 4 dígitos 🔴", code: "CLAVE_FORMATO" });
    }

    const emailKey = email.trim().toLowerCase();
    const guardKey = { email: emailKey, event: "login-pin" };

    try {
        /* ══════════════════════════════════════════════════════
           1. FIRMA DE 4 DÍGITOS — antes de tocar Firebase
           Reserva el intento de forma atómica ANTES de verificar:
           si mandan 50 pedidos en paralelo, solo 5 llegan a verifyPin.
        ══════════════════════════════════════════════════════ */
        const now = Date.now();

        // Me aseguro de que exista el registro (sin duplicarlo)
        await Audit.updateOne(guardKey, { $setOnInsert: { attempts: 0, lastAttemptAt: now } }, { upsert: true });

        // Si el último intento fue hace más de 15 min, el contador arranca de cero (vence el bloqueo)
        await Audit.updateOne(
            { ...guardKey, lastAttemptAt: { $lt: now - PIN_LOCK_MS } },
            { $set: { attempts: 0 } }
        );

        // Reservo el intento solo si no está bloqueado
        const guard = await Audit.findOneAndUpdate(
            { ...guardKey, attempts: { $lt: PIN_MAX_ATTEMPTS } },
            { $inc: { attempts: 1 }, $set: { lastAttemptAt: now } },
            { new: true }
        );

        if (!guard) {
            return res.status(429).json({
                message: `Demasiadas firmas incorrectas. Reintentá en ${PIN_LOCK_MS / 60000} minutos 🔴`,
                code: "CLAVE_BLOQUEADA"
            });
        }

        let pinOk = false;
        try {
            pinOk = await verifyPin(pin);
        } catch (err) {
            console.error(esProduccion ? "ERROR_SIGN_PIN_CONFIG" : `ERROR_SIGN_PIN_CONFIG: ${err.message}`);
            return res.status(500).json({ message: "Firma no configurada en el servidor 🔴", code: "CLAVE_NO_CONFIGURADA" });
        }

        if (!pinOk) {
            await strikeIp(req, "invalid-login-pin"); // También suma al bloqueo por IP (cubre a quien rota emails)
            const remaining = PIN_MAX_ATTEMPTS - guard.attempts;
            if (remaining <= 0) {
                return res.status(429).json({
                    message: `Firma incorrecta. Bloqueado por ${PIN_LOCK_MS / 60000} minutos 🔴`,
                    code: "CLAVE_BLOQUEADA"
                });
            }
            return res.status(401).json({
                message: `Firma incorrecta. Te quedan ${remaining} intento(s) 🔴`,
                code: "CLAVE_INCORRECTA",
                remaining
            });
        }

        // Firma correcta → reseteo el contador y saco el pin del body
        await Audit.updateOne(guardKey, { $set: { attempts: 0 } });
        delete req.body.pin;

        // 2. Validar credenciales contra la API de Firebase Auth
        const firebaseResponse = await axios.post(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
            { email, password, returnSecureToken: true }
        );

        const { idToken, localId: uid } = firebaseResponse.data;

        // 3. Verificar el token obtenido y obtener claims
        const decoded = await auth.verifyIdToken(idToken);

        // 4. Control de Baneo (Lógica de negocio)
        if (decoded.banned) {
            return res.status(403).json({ code: "auth/user-banned", message: "User is banned" });
        }

        // 5. Limpiar intentos fallidos y Auditar
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

        res.cookie("idToken", idToken, { ...COOKIE_BASE, maxAge: SESSION_MAX_AGE });

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
        res.clearCookie("idToken", COOKIE_BASE);

        return res.status(200).json({ message: "Logout audited! 🟢" })
    } catch (error) {
        console.error(esProduccion ? `Logout fallback! 🔴` : `Logout fallback! 🔴 ${error}`);
        res.clearCookie("idToken", COOKIE_BASE); // Aunque falle la auditoría, la cookie se borra igual
        return res.status(200).json({ message: "Logout fallback! 🟡" });
        // Devuelvo 200 opr UX para no confundir al front y borrar token cuando no se deslogueo bien
    }
})

authRouter.post("/login-failed", ipGuard, async (req, res) => {
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
        // Reseteo los strikes por intentar entrar a zona admin (si no, al primer intento lo vuelve a banear)
        await Audit.findOneAndUpdate(
            { uid, event: "intrusion-user" },
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
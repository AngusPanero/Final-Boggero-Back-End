const rateLimit = require("express-rate-limit")

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 10, // limite por ip
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Comportamiento sospechoso... Demasiadas solicitudes, intentá más tarde"
    },
    skipSuccessfulRequests: false,
})

module.exports = loginLimiter
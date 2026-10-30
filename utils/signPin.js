// ═══════════════════════════════════════════════════════════════════════════════
//  utils/signPin.js — Firma de 4 dígitos para el login del panel admin
//  (mismo esquema que Hidden Security y Quinta de Argos)
//
//  Cómo se protege la clave:
//   1. HMAC-SHA256 con un "pepper" secreto (ADMIN_SIGN_PEPPER) → sin el pepper
//      el hash no sirve para nada, ni siquiera probando las 10.000 combinaciones.
//   2. scrypt con salt aleatorio (función lenta, resistente a GPU).
//   3. Comparación en tiempo constante (timingSafeEqual).
//
//  En el backend solo viven el HASH y el PEPPER, nunca la clave en texto plano.
//  Formato de ADMIN_SIGN_PIN_HASH:  scrypt:N:r:p:<saltBase64>:<hashBase64>
// ═══════════════════════════════════════════════════════════════════════════════

const crypto = require("crypto");
const { promisify } = require("util");

const scryptAsync = promisify(crypto.scrypt);

const PIN_REGEX = /^\d{4}$/;
const KEY_LEN   = 64;
const DEFAULTS  = { N: 16384, r: 8, p: 1 };

function getPepper() {
    const pepper = process.env.ADMIN_SIGN_PEPPER;
    if (!pepper || pepper.length < 32) {
        throw new Error("ADMIN_SIGN_PEPPER no configurado o demasiado corto");
    }
    return pepper;
}

function pepperize(pin) {
    return crypto.createHmac("sha256", getPepper()).update(String(pin), "utf8").digest();
}

async function hashPin(pin) {
    if (!PIN_REGEX.test(String(pin))) throw new Error("La clave debe ser de 4 dígitos");
    const { N, r, p } = DEFAULTS;
    const salt = crypto.randomBytes(16);
    const hash = await scryptAsync(pepperize(pin), salt, KEY_LEN, { N, r, p });
    return `scrypt:${N}:${r}:${p}:${salt.toString("base64")}:${hash.toString("base64")}`;
}

async function verifyPin(pin) {
    // Formato inválido → false sin tocar nada más
    if (typeof pin !== "string" || !PIN_REGEX.test(pin)) return false;

    const stored = process.env.ADMIN_SIGN_PIN_HASH;
    if (!stored) throw new Error("ADMIN_SIGN_PIN_HASH no configurado");

    const parts = stored.split(":");
    if (parts.length !== 6 || parts[0] !== "scrypt") {
        throw new Error("ADMIN_SIGN_PIN_HASH con formato inválido");
    }

    const [, N, r, p, saltB64, hashB64] = parts;
    const salt     = Buffer.from(saltB64, "base64");
    const expected = Buffer.from(hashB64, "base64");

    const candidate = await scryptAsync(pepperize(pin), salt, expected.length, {
        N: Number(N), r: Number(r), p: Number(p),
    });

    return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

module.exports = { hashPin, verifyPin, PIN_REGEX };
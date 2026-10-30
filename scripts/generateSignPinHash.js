// ═══════════════════════════════════════════════════════════════════════════════
//  scripts/generateSignPinHash.js
//
//  Uso (desde la raíz del backend):   node scripts/generateSignPinHash.js
//
//  - Pide la firma de 4 dígitos por consola (se ven asteriscos, no queda en el
//    historial de la terminal porque no va como argumento).
//  - Te la pide dos veces para evitar errores de tipeo.
//  - Genera un pepper nuevo y aleatorio, y el hash de la firma con ese pepper.
//  - Imprime las dos variables para pegar en el .env y en Render.
//
//  La firma en texto plano NO se guarda en ningún lado.
//  Si querés cambiar la firma, volvé a correr el script y reemplazá AMBAS variables.
// ═══════════════════════════════════════════════════════════════════════════════

const crypto = require("crypto");
const path = require("path");

// Pepper nuevo (64 bytes aleatorios → 88 caracteres base64). Se setea ANTES de usar hashPin
const pepper = crypto.randomBytes(64).toString("base64");
process.env.ADMIN_SIGN_PEPPER = pepper;

const { hashPin, verifyPin, PIN_REGEX } = require(path.join(__dirname, "..", "utils", "signPin"));

// Lee una línea de la consola mostrando asteriscos en vez de los dígitos
function askHidden(question) {
    return new Promise((resolve, reject) => {
        const stdin = process.stdin;
        const stdout = process.stdout;

        if (!stdin.isTTY) {
            reject(new Error("Corré el script en una terminal interactiva (no con pipes)."));
            return;
        }

        stdout.write(question);
        stdin.setRawMode(true);
        stdin.resume();
        stdin.setEncoding("utf8");

        let value = "";

        // La terminal puede mandar varios caracteres juntos (pegar, tipeo rápido): los proceso de a uno
        const onData = (chunk) => {
            for (const char of chunk) {
                if (handleChar(char)) return;
            }
        };

        // Devuelve true cuando terminó de leer
        const handleChar = (char) => {
            switch (char) {
                case "\r":
                case "\n":
                case "\u0004": // Ctrl+D
                    stdin.setRawMode(false);
                    stdin.pause();
                    stdin.removeListener("data", onData);
                    stdout.write("\n");
                    resolve(value);
                    return true;
                case "\u0003": // Ctrl+C
                    stdin.setRawMode(false);
                    stdout.write("\nCancelado.\n");
                    process.exit(1);
                    break;
                case "\u007f": // Backspace
                case "\b":
                    if (value.length > 0) {
                        value = value.slice(0, -1);
                        stdout.write("\b \b");
                    }
                    break;
                default:
                    // Solo acepto dígitos
                    if (/^\d$/.test(char) && value.length < 4) {
                        value += char;
                        stdout.write("*");
                    }
            }
            return false;
        };

        stdin.on("data", onData);
    });
}

// Firmas fáciles de adivinar que no se aceptan
const WEAK_PINS = new Set([
    "0000", "1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999",
    "1234", "4321", "1212", "0123", "9876", "1122", "2580", "1004", "2000", "1010",
]);

(async () => {
    try {
        const pin = await askHidden("Firma de 4 dígitos: ");
        if (!PIN_REGEX.test(pin)) throw new Error("La firma tiene que ser exactamente 4 dígitos.");
        if (WEAK_PINS.has(pin) || /^(19|20)\d{2}$/.test(pin)) {
            throw new Error("Esa firma es demasiado fácil de adivinar (repetida, secuencia o año). Elegí otra.");
        }

        const confirm = await askHidden("Repetila: ");
        if (pin !== confirm) throw new Error("Las firmas no coinciden.");

        const hash = await hashPin(pin);

        // Verificación de que el hash generado funciona antes de mostrarlo
        process.env.ADMIN_SIGN_PIN_HASH = hash;
        const ok = await verifyPin(pin);
        if (!ok) throw new Error("No se pudo verificar el hash generado.");

        console.log("\n✅ Listo. Pegá estas dos líneas en el .env del backend y en Render (Environment):\n");
        console.log(`ADMIN_SIGN_PEPPER="${pepper}"`);
        console.log(`ADMIN_SIGN_PIN_HASH="${hash}"`);
        console.log("\n⚠️  No las subas al repo. Si se filtran, volvé a correr el script y reemplazá las dos.\n");
        process.exit(0);
    } catch (err) {
        console.error(`\n🔴 ${err.message}\n`);
        process.exit(1);
    }
})();
require("dotenv").config()
const express = require("express")
const nodemailer = require("nodemailer")

const mailRouter = express.Router()

const esProduccion = (process.env.NODE_ENV === 'ppproduction');

// Contact
mailRouter.post("/send-email", async (req, res) => {
    const { name, lastName, companyName, contactRole, email, phone, projectOption, typeOfWork, currentUrl, description, projectGoal, budgetRange, availableTime } = req.body
    
    if(!name || !lastName || !companyName || !contactRole || !email || !phone || !projectOption || !typeOfWork || !description || !projectGoal || !budgetRange || !availableTime){
        return res.status(400).json({ message: "All required fields must be filled! 🔴" })
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_FROM,
            pass: process.env.PASS_EMAIL
        }
    })

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: process.env.EMAIL_TO, // A dónde querés que llegue el Mail
        subject: `Nueva Consulta De Proyecto.`,
        html: `<!DOCTYPE html>
                <html>
                <head>
                    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&display=swap" rel="stylesheet">
                </head>
                <body style="margin: 0; padding: 0; font-family: 'Montserrat', sans-serif; background-color: #020617; color: #ffffff;">
                    <div class="wrapper" style="width: 100%; padding: 40px 0; display: flex; justify-content: center; ">
                        <div class="purchase-card" style="width: 500px; margin: 0 auto;  border-radius: 12px; overflow: hidden; box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6); border: 2px solid rgba(142, 45, 226, 0.4);">
                            
                            <div class="mac-header" style="background: rgba(255, 255, 255, 0.03); padding: 12px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                                <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                                    <tr>
                                        <td style="width: 60px;">
                                            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #ff5f56; margin-right: 4px;"></span>
                                            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #ffbd2e; margin-right: 4px;"></span>
                                            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #27c93f;"></span>
                                        </td>
                                        <td style="font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #94a3b8; text-align: left; padding-left: 10px;">
                                            incoming_request.json
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <div class="content" style="padding: 30px;">
                                <div class="status-badge" style="display: inline-block; background: rgba(142, 45, 226, 0.1); color: #c084fc; padding: 4px 10px; border: 1px solid rgba(142, 45, 226, 0.3); border-radius: 6px; font-size: 10px; font-weight: 700; text-transform: uppercase; margin-bottom: 15px;">
                                    Nuevo Ticket de Proyecto
                                </div>
                                
                                <h1 class="title" style="font-size: 22px; font-weight: 800; margin: 0 0 20px 0; letter-spacing: -0.5px; color: #ffffff;">
                                    Detalles de la Consulta
                                </h1>
                                
                                <table class="receipt-table" style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); color: #cdb6ffff; font-family: 'Courier New', monospace; font-size: 18px; text-transform: uppercase; font-weight: 600;">Cliente:</td>
                                        <td style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); text-align: right; color: #f1f5f9; font-size: 18px; font-weight: 500;">${name} ${lastName}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); color: #cdb6ffff; font-family: 'Courier New', monospace; font-size: 18px; text-transform: uppercase; font-weight: 600;">Empresa:</td>
                                        <td style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); text-align: right; color: #f1f5f9; font-size: 18px; font-weight: 500;">${companyName} <span style="color: #94a3b8; font-size: 18px;">(${contactRole})</span></td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); color: #cdb6ffff; font-family: 'Courier New', monospace; font-size: 18px; text-transform: uppercase; font-weight: 600;">Email:</td>
                                        <td style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); text-align: right; color: #38bdf8; font-size: 18px; font-weight: 500;">${email}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); color: #cdb6ffff; font-family: 'Courier New', monospace; font-size: 18px; text-transform: uppercase; font-weight: 600;">Presupuesto:</td>
                                        <td style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); text-align: right; color: #4ade80; font-size: 18px; font-weight: 700;">${budgetRange}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); color: #cdb6ffff; font-family: 'Courier New', monospace; font-size: 18px; text-transform: uppercase; font-weight: 600;">Timeline:</td>
                                        <td style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); text-align: right; color: #f1f5f9; font-size: 18px; font-weight: 500;">${availableTime}</td>
                                    </tr>
                                </table>

                                <div style="color: #cdb6ffff; font-family: 'Courier New', monospace; font-size: 10px; text-transform: uppercase; font-weight: 600; margin-bottom: 10px;">Objetivo del Proyecto:</div>
                                <div style="margin-bottom: 25px; font-size: 14px; border-left: 3px solid #8e2de2; padding-left: 15px; color: #cbd5e1; font-style: italic;">
                                    "${projectGoal}"
                                </div>

                                <div style="color: #cdb6ffff; font-family: 'Courier New', monospace; font-size: 10px; text-transform: uppercase; font-weight: 600; margin-bottom: 10px;">Mensaje Adicional:</div>
                                <div class="description-box" style="background: rgba(0, 0, 0, 0.2); padding: 15px; border-radius: 8px; border: 1px dashed rgba(142, 45, 226, 0.5); color: #94a3b8; font-size: 12px; line-height: 1.6;">
                                    ${description}
                                </div>
                            </div>
                            
                            <div class="footer" style="background: rgba(0, 0, 0, 0.2); padding: 20px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid rgba(255, 255, 255, 0.05); line-height: 1.5;">
                                <strong style="color: #ffffff;">SISTEMA DE CONTACTO DEEPDEV STUDIO</strong><br>
                                Este correo fue generado automáticamente por el portal.<br>
                                © 2026 — Built with precision.
                            </div>
                        </div>
                    </div>
                </body>
                </html>`
    }
    try {
        await transporter.sendMail(mailOptions)
        res.status(200).json({ success: true, message: 'Correo enviado con éxito' })
    } catch (error) {
        console.error(esProduccion ? `Internal error setting up mail transporter! 🔴` : `Internal error setting up mail transporter! 🔴 ${error}`);
        res.status(500).send({ message: `Internal error setting up mail transporter! 🔴 ${error}` })
    }
})

// Ticket Compra
mailRouter.post("/ticket-order", async (req, res) => {
    const { name, plan, price, email } = req.body

    if(!name || !plan || !price || !email) {
        return res.status(400).json({ message: "All Fields are required! 🔴" })
    } 
    
    const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.TICKETS_EMAIL_FROM, // ORIGEN
                pass: process.env.TICKETS_PASS_EMAIL //PASS APP
            }
    })

    const ticketsMailOptions = {
        from: process.env.TICKETS_EMAIL_FROM, // EL COMPRADOR
        to: email, // A dónde querés que llegue el Mail
        subject: `Ticket de compra DeepDev.`,
        html: `
                        <!DOCTYPE html>
            <html>
            <head>
                <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&display=swap" rel="stylesheet">
                <style>
                    :root {
                        --bg-dark: #0f172a;
                        --accent: #8e2de2;
                        --text-main: #ffffff;
                        --text-dim: #94a3b8;
                        --border: rgba(142, 45, 226, 0.4);
                        --success: #4ade80;
                    }

                    body {
                        margin: 0; padding: 0;
                        font-family: 'Montserrat', sans-serif;
                        background-color: #020617;
                        color: var(--text-main);
                    }

                    .wrapper {
                        width: 100%;
                        padding: 20px 0;
                        display: flex;
                        justify-content: center;
                    }

                    .purchase-card {
                        width: 380px; 
                        background-color: #0f172a;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6);
                        border: 1px solid var(--border);
                    }

                    .mac-header {
                        background: rgba(255, 255, 255, 0.03);
                        padding: 10px 15px;
                        display: flex;
                        align-items: center;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    }

                    .mac-dots { display: flex; gap: 6px; }
                    .m-dot { width: 10px; height: 10px; border-radius: 50%; }
                    .m-red { background: #ff5f56; }
                    .m-yellow { background: #ffbd2e; }
                    .m-green { background: #27c93f; }

                    .filename {
                        margin-left: 12px;
                        font-size: 11px;
                        font-family: 'Fira Code', monospace;
                        color: var(--text-dim);
                    }

                    .content { padding: 25px; }

                    .status-badge {
                        display: inline-block;
                        background: rgba(74, 222, 128, 0.1);
                        color: var(--success);
                        padding: 4px 10px;
                        border: 1px solid rgba(74, 222, 128, 0.3);
                        border-radius: 6px;
                        font-size: 10px;
                        font-weight: 700;
                        text-transform: uppercase;
                        margin-bottom: 15px;
                    }

                    .title {
                        font-size: 20px;
                        font-weight: 800;
                        margin: 0 0 20px 0;
                        letter-spacing: -0.5px;
                    }

                    .receipt-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }

                    .receipt-table td {
                        padding: 12px 0;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                        font-size: 13px;
                    }

                    .label {
                        color: #c084fc;
                        font-family: 'Fira Code', monospace;
                        font-size: 10px;
                        text-transform: uppercase;
                        font-weight: 600;
                    }

                    .value { text-align: right; color: #f1f5f9; font-weight: 500; }

                    .total-row { border-top: 2px solid var(--accent) !important; }
                    .total-price {
                        color: var(--success);
                        font-size: 18px;
                        font-weight: 800;
                    }

                    .footer {
                        background: rgba(0, 0, 0, 0.2);
                        padding: 15px;
                        text-align: center;
                        font-size: 10px;
                        color: var(--text-dim);
                        border-top: 1px solid rgba(255, 255, 255, 0.05);
                        line-height: 1.5;
                    }
                </style>
            </head>
            <body>
                <div class="wrapper">
                    <div class="purchase-card">
                        <div class="mac-header">
                            <div class="mac-dots">
                                <div class="m-dot m-red"></div>
                                <div class="m-dot m-yellow"></div>
                                <div class="m-dot m-green"></div>
                            </div>
                            <div class="filename" style="color: #ffffff;">success_payment.DeepDev</div>
                        </div>

                        <div class="content">
                            <div class="status-badge" style="color: #ffffff;">Pago Aprobado</div>
                            <h1 class="title" style="color: #ffffff;">Confirmación de Compra</h1>
                            
                            <table class="receipt-table">
                                <tr>
                                    <td class="label" style="color: #cdb6ffff;">Cliente:</td>
                                    <td class="value" style="color: #ffffff;">${name}</td>
                                </tr>
                                <tr>
                                    <td class="label" style="color: #cdb6ffff;">Email:</td>
                                    <td class="value" style="color: #ffffff;">${email}</td>
                                </tr>
                                <tr>
                                    <td class="label" style="color: #cdb6ffff;">Plan Adquirido:</td>
                                    <td class="value" style="color: #ffffff;">${plan}</td>
                                </tr>
                                <tr class="total-row">
                                    <td class="label" style="color: #cdb6ffff;">Total:</td>
                                    <td class="value total-price" style="padding-top: 15px; color: #ffffff;">$${price}</td>
                                </tr>
                            </table>
                        </div>
                        
                        <div class="footer" style="color: #ffffff;">
                            <strong>DEEPDEV STUDIO</strong><br>
                            Gracias por confiar en nosotros.<br>
                            © 2026 Código sin límites.
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `
    }

    try {
        await transporter.sendMail(ticketsMailOptions)
        res.status(200).json({ success: true, message: 'Correo enviado con éxito' })
    } catch (error) {
        res.status(500).json({ message: "Error creating ticket! 🔴", error: error.message })
        console.error(esProduccion ? "Error creating ticket! 🔴" : `Error creating ticket! 🔴 ${error}`);
    }
})

module.exports = mailRouter
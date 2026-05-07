require("dotenv").config()
const express = require("express")
const nodemailer = require("nodemailer")

const mailRouter = express.Router()

const esProduccion = (process.env.NODE_ENV === 'production');

mailRouter.post("/sendemail", async (req, res) => {
    const { name, lastName, phone, type, email, comment } = req.body
    
    if(!name || !lastName || !phone || !type || !email || !comment){
        return res.status(400).json({ message: "All required fields must be filled! 🔴" })
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASS_EMAIL
        }
    })

    const mailOptions = {
        from: email,
        to: process.env.EMAIL,
        subject: `Nueva Consulta — ${type} | Boggero Propiedades`,
        html: `<!DOCTYPE html>
        <html>
        <head>
            <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Montserrat', sans-serif; background-color: #0d1017;">

            <div style="width: 100%; padding: 40px 0;">
                <div style="width: 560px; margin: 0 auto; border-radius: 6px; overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,0.4); border: 1px solid rgba(201, 99, 122, 0.15);">

                    <!-- HEADER -->
                    <div style="background-color: #141820; padding: 36px 40px; text-align: center; border-bottom: 1px solid rgba(201, 99, 122, 0.15);">
                        <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; letter-spacing: 4px; color: #c9637a; text-transform: uppercase;">Boggero Propiedades</p>
                        <h1 style="margin: 0 0 16px 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Nueva Consulta Recibida</h1>
                        <span style="background-color: rgba(201, 99, 122, 0.12); color: #f0c4ce; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; padding: 6px 16px; border-radius: 3px; border: 1px solid rgba(201, 99, 122, 0.15);">${type}</span>
                    </div>

                    <!-- BODY -->
                    <div style="background-color: #141820; padding: 40px;">

                        <p style="margin: 0 0 28px 0; font-size: 11px; font-weight: 700; letter-spacing: 3px; color: #c9637a; text-transform: uppercase;">Datos del Contacto</p>

                        <!-- Nombre -->
                        <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid rgba(128, 128, 128, 0.15);">
                            <p style="margin: 0 0 4px 0; font-size: 10px; font-weight: 700; letter-spacing: 2px; color: rgba(255,255,255,0.35); text-transform: uppercase;">Nombre Completo</p>
                            <p style="margin: 0; font-size: 16px; font-weight: 600; color: #ffffff;">${name} ${lastName}</p>
                        </div>

                        <!-- Email -->
                        <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid rgba(128, 128, 128, 0.15);">
                            <p style="margin: 0 0 4px 0; font-size: 10px; font-weight: 700; letter-spacing: 2px; color: rgba(255,255,255,0.35); text-transform: uppercase;">Email</p>
                            <a href="mailto:${email}" style="margin: 0; font-size: 16px; font-weight: 500; color: #c9637a; text-decoration: none; display: block;">${email}</a>
                        </div>

                        <!-- Teléfono -->
                        <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid rgba(128, 128, 128, 0.15);">
                            <p style="margin: 0 0 4px 0; font-size: 10px; font-weight: 700; letter-spacing: 2px; color: rgba(255,255,255,0.35); text-transform: uppercase;">Teléfono</p>
                            <a href="tel:${phone}" style="margin: 0; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; display: block;">${phone}</a>
                        </div>

                        <!-- Tipo de consulta -->
                        <div style="margin-bottom: 28px; padding-bottom: 16px; border-bottom: 1px solid rgba(128, 128, 128, 0.15);">
                            <p style="margin: 0 0 4px 0; font-size: 10px; font-weight: 700; letter-spacing: 2px; color: rgba(255,255,255,0.35); text-transform: uppercase;">Tipo de Consulta</p>
                            <p style="margin: 0; font-size: 16px; font-weight: 600; color: #ffffff;">${type}</p>
                        </div>

                        <!-- Comentario -->
                        <p style="margin: 0 0 12px 0; font-size: 10px; font-weight: 700; letter-spacing: 2px; color: rgba(255,255,255,0.35); text-transform: uppercase;">Mensaje</p>
                        <div style="background-color: rgba(201, 99, 122, 0.12); border-left: 3px solid #c9637a; padding: 20px; border-radius: 3px; border-top: 1px solid rgba(201, 99, 122, 0.15); border-right: 1px solid rgba(201, 99, 122, 0.15); border-bottom: 1px solid rgba(201, 99, 122, 0.15);">
                            <p style="margin: 0; font-size: 14px; font-weight: 500; color: #f0c4ce; line-height: 1.7;">${comment}</p>
                        </div>

                    </div>

                    <!-- FOOTER -->
                    <div style="background-color: #0d1017; padding: 24px 40px; text-align: center; border-top: 1px solid rgba(201, 99, 122, 0.15);">
                        <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; letter-spacing: 3px; color: #c9637a; text-transform: uppercase;">Boggero Propiedades</p>
                        <p style="margin: 0; font-size: 11px; color: rgba(255,255,255,0.35); line-height: 1.6;">Ramos Mejía, Buenos Aires · boggeropropiedades@gmail.com</p>
                        <p style="margin: 8px 0 0 0; font-size: 10px; color: rgba(255,255,255,0.2);">© 2026 — Este correo fue generado automáticamente.</p>
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

module.exports = mailRouter
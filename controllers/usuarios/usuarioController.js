
const Usuario = require("../../models/usuarios/usuario")

const service = require('../../services')
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

const crypto = require('crypto');
const nodemailer = require('nodemailer');

async function registroUsuario(req, res) {

    try {
        const data = req.body;
        console.log(data);

        //Verificar si estan todos los campos
        await body('email').notEmpty().withMessage('El campo "email" es requerido').isEmail().withMessage('El campo "email" debe ser un email válido').run(req);
        await body('password').notEmpty().withMessage('El campo "password" es requerido').run(req);
 
        const errors = validationResult(req);
        if (!errors.isEmpty()) { 
            return res.status(400).json({
                status: '400 BAD REQUEST',
                message: 'Errores de validación',
                errors: errors.array()
            });
        }


        //Verificar si ya existe un usuario con el mismo correo electrónico
        const existingUser = await Usuario.findOne({ email: data.email });

        if (existingUser) {
            return res.status(400).json({
                status: '400 BAD REQUEST',
                message: 'Ya existe un usuario con el correo electrónico proporcionado'
            });
        }

        // Generar un código único y su fecha de expiración
        const verificationCode = crypto.randomInt(100000, 999999).toString(); // Código numérico de 6 dígitos
        const expirationTime = Date.now() + 10 * 60 * 1000; // Expira en 10 minutos

    
       //Encriptar la contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);

        let usuario = new Usuario({
            _id: data._id,
            email: data.email,
            password: hashedPassword,
            verificationCode: verificationCode,
            codeExpiresAt: expirationTime,
        });

        const savedUser = await usuario.save();

         // Enviar el correo con el código de verificación
         const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'sr.leobardo@gmail.com',
                pass: 'tleq zdii xikz mrsb',
            },
        });

        const mailOptions = {
            from: 'sr.leobardo@gmail.com',
            to: savedUser.email,
            subject: 'Código de Verificación',
            text: `Hola, tu código de verificación es ${verificationCode}. Este código expirará en 10 minutos.`,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({
            status: "200 OK",
            message: "Usuario guardado exitosamente",
            data: {token:  service.createToken(savedUser),
            user:savedUser}
        });

    } catch (error) {

        res.status(500).json({
            status: '500 ERROR INTERNO DE SERVIDOR',
            message: `Error al intentar guardar el usuario: ${error.message}`
        });
    }

  


}

async function verificarUsuario(req, res) {
    try {
        const { email, verificationCode } = req.body;

        // Buscar el usuario por email
        const user = await Usuario.findOne({ email });

        if (!user) {
            return res.status(404).json({
                status: "404 NOT FOUND",
                message: "Usuario no encontrado",
            });
        }

        // Verificar si el código coincide y no ha expirado
        if (user.verificationCode !== verificationCode) {
            return res.status(400).json({
                status: "400 BAD REQUEST",
                message: "Código de verificación incorrecto",
            });
        }

        if (user.codeExpiresAt < Date.now()) {
            return res.status(400).json({
                status: "400 BAD REQUEST",
                message: "El código de verificación ha expirado",
            });
        }

        // Actualizar el estado del usuario a verificado
        user.verificationCode = null;
        user.codeExpiresAt = null;
        user.isVerified = true; // Agrega este campo en el esquema si no existe
        await user.save();

        res.status(200).json({
            status: "200 OK",
            message: "Usuario verificado exitosamente",
            data: {token:  service.createToken(user),
            user:user}
        });
    } catch (error) {
        res.status(500).json({
            status: "500 INTERNAL SERVER ERROR",
            message: `Error al verificar el usuario: ${error.message}`,
        });
    }
}


module.exports = {
    registroUsuario,
    verificarUsuario
}

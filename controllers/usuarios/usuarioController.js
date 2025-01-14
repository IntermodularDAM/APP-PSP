
const Usuario = require("../../models/usuarios/usuario")
const Administrador = require("../../models/usuarios/perfiles/administrador");
const Empleado = require("../../models/usuarios/perfiles/empleado");
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
                message: 'API: Errores de validación',
                errors: errors.array()
            });
        }


        //Verificar si ya existe un usuario con el mismo correo electrónico
        const existingUser = await Usuario.findOne({ email: data.email });

        if (existingUser) {
            return res.status(400).json({
                status: '400 BAD REQUEST',
                message: 'API: Ya existe un usuario con el correo electrónico proporcionado'
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
            message: "API : Usuario guardado exitosamente",
            data: { 
                email:savedUser.email
            }
        });

    } catch (error) {

        res.status(500).json({
            status: '500 ERROR INTERNO DE SERVIDOR',
            message: `API : Error al intentar guardar el usuario: ${error.message}`
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
                message: "API : Usuario no encontrado",
            });
        }

        // Verificar si el código coincide y no ha expirado
        if (user.verificationCode !== verificationCode) {
            return res.status(400).json({
                status: "400 BAD REQUEST",
                message: "API : Código de verificación incorrecto",
            });
        }

        if (user.codeExpiresAt < Date.now()) {
            return res.status(400).json({
                status: "400 BAD REQUEST",
                message: "API : El código de verificación ha expirado",
            });
        }

        // Actualizar el estado del usuario a verificado
        user.verificationCode = null;
        user.codeExpiresAt = null;
        user.isVerified = true; // Agrega este campo en el esquema si no existe
        await user.save();

        res.status(200).json({
            status: "200 OK",
            message: "API : Usuario verificado exitosamente",
            data: {email:user.email,
                idUsuario:user._id}
        });
    } catch (error) {
        res.status(500).json({
            status: "500 INTERNAL SERVER ERROR",
            message: `API : Error al verificar el usuario: ${error.message}`,
        });
    }
}

async function logIn(req, res){

    try {

        const { email, password } = req.body;

        // Buscar usuario en la colección de usuarios
        const usuario = await Usuario.findOne({ email });

        if (!usuario) {
            return res.status(404).send({ message: 'Usuario no encontrado' });
        }

        // Verificar contraseña
        const passwordMatch = await bcrypt.compare(password, usuario.password);
        if (!passwordMatch) {
            return res.status(401).send({ message: 'Contraseña incorrecta' });
        }

        // Buscar perfil asociado (Administrador o Empleado)
        const perfil =
            (await Administrador.findOne({ idUsuario: usuario._id })) ||
            (await Empleado.findOne({ idUsuario: usuario._id }));

        if (!perfil) {
            return res.status(403).send({ message: 'Perfil no autorizado' });
        }

        // Verificar roles permitidos
        if (perfil.rol !== 'Administrador' && perfil.rol !== 'Empleado') {
            return res.status(403).send({ message: 'Rol no permitido' });
        }

        const Token = service.createToken(usuario._id, perfil.rol);
        res.status(200).json({
            status: "200 OK",
            message:'LOGEADO',
            data : { token: Token,
            user:perfil}
           
        }) 

        console.log()
        // // Generar token con rol incluido
        // const token = jwt.sign(
        //     { id: usuario._id, rol: perfil.rol },
        //     process.env.SECRET_KEY, // Usa tu clave secreta
        //     { expiresIn: '24h' } // Token válido por 24 horas
        // );

        // res.status(200).send({ token, rol: perfil.rol });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error interno del servidor' });
    }
}


module.exports = {
    registroUsuario,
    verificarUsuario,
    logIn,
}

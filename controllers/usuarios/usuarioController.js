
const Usuario = require("../../models/usuarios/usuario")
const Administrador = require("../../models/usuarios/perfiles/administrador");
const Empleado = require("../../models/usuarios/perfiles/empleado");
const Cliente = require("../../models/usuarios/perfiles/cliente");
const service = require('../../services')
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const config = require("../../config")

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


        // //Verificar si ya existe un usuario con el mismo correo electrónico
        // const existingUser = await Usuario.findOne({ email: data.email });

        // if (existingUser) {
        //     return res.status(400).json({
        //         status: '400 BAD REQUEST',
        //         message: 'API: Ya existe un usuario con el correo electrónico proporcionado'
        //     });
        // }

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
                user: config.MAIL_APPLICATION,
                pass: config.PASSWOR_APPLICATION,
            },
        });

        const mailOptions = {
            from: config.MAIL_APPLICATION,
            to: savedUser.email,
            subject: 'Código de Verificación',
            text: `Hola, tu código de verificación es ${verificationCode}. 
            \nTu email para usar la app es:  ${savedUser.emailApp}. 
            \nTu contraseña de acceso: ${data.password}
            \nGracias por registrarte.`,
        };

        await transporter.sendMail(mailOptions);

        console.log("Usuario Creado: "+savedUser)

        res.status(200).json({
            status: "200 OK",
            message: "API : Usuario guardado exitosamente",
            data: { 
                email:savedUser.email,
                email:savedUser.emailApp,
                id:savedUser._id
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
        const { emailApp, verificationCode, _id } = req.body;
        console.log(emailApp);
        console.log(_id);

        // Buscar el usuario por email
        const user = await Usuario.findOne({ emailApp: email, _id:_id });

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
            data: {emailApp:user.emailApp,
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
        console.log("Se intento login")

        const { email, password } = req.body;

        // Buscar usuario en la colección de usuarios
        const usuario = await Usuario.findOne({ email });

        if (!usuario) {
            return res.status(404).send({status:'Error 404' ,message: 'Email no encontrado' });
        }

        // Verificar contraseña
        const passwordMatch = await bcrypt.compare(password, usuario.password);
        if (!passwordMatch) {
            return res.status(401).send({status:'Error 404' , message: 'Contraseña incorrecta' });
        }

        // Buscar perfil asociado (Administrador o Empleado)
        const perfil =
            (await Administrador.findOne({ idUsuario: usuario._id })) ||
            (await Empleado.findOne({ idUsuario: usuario._id }));

        if (!perfil) {
            return res.status(403).send({status:'Error 403' , message: 'Perfil no autorizado' });
        }

        // Verificar roles permitidos
        if (perfil.rol !== 'Administrador' && perfil.rol !== 'Empleado') {
            return res.status(403).send({status:'Error 403' , message: 'Rol no permitido' });
        }

        const Token = service.createToken(usuario._id, perfil.rol);
        const AppToken = service.createSimpleToken();

        console.log(perfil)

        res.status(200).json({
            status: "200 OK",
            message:'LOGEADO',
            data : { 
                token: Token,
                appToken: AppToken,
                user:perfil

            }
           
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
        res.status(500).send({status:'Error 500' , message: 'Error interno del servidor' });
    }
}

async function eliminarUsuario(req,res){

    const  emailApp  = req.body.emailApp;
    console.log(emailApp)
    try{
        const user = await Usuario.deleteOne({emailApp});
        if (user.deletedCount === 0) {
            return res.status(404).json({
                status: "404 NOT FOUND",
                message: 'API : El usuario no existe.'
            });
        }
        res.status(200).json(
            {
                status: "200 OK",
                message : 'API :El usuario ha sido eliminado.'
            })
    }catch(err){
        return res.status(500).json({
            status: '500 ERROR INTERNO DE SERVIDOR',
            message: `API : ERROR AL REALIZAR LA OPERACION : ${err}`
        })
    }    
}

async function  todosLosUsuarios(req,res){
    
    try{
        const user = await Usuario.find()
        return !user ? 
        res.status(404).json({ 
            status: '404 NOT FOUND',
            message : 'LOS USUARIOS NO EXISTE'
         })
        : res.status(200).json({
            status: '200 OK',
            data: user
        })
    }catch(error){
        return res.status(500).json({
            status: '500 ERROR INTERNO DE SERVIDOR',
            message: `ERROR AL REALIZAR LA OPERACION : ${error}`
        })
    }
}

async function emailDisponible(req, res){
    

    try {


        const  email  = req.body.email;

        // Buscar usuario en la colección de usuarios
        const usuario = await Usuario.findOne({ email });

        if (usuario) {

            return res.status(404).send({ message: 'Email no disponible' });
        }


        res.status(200).json({
            status: "200 OK",
            message:'Email Dispònible'

           
        }) 
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error interno del servidor' });
    }
}


async function recuperarPassword(req, res){

    try {
        console.log("Se intento recuperar")

        const  email  = req.body.email;
        console.log(email)

        // Buscar usuario en la colección de usuarios
        const usuario = await Usuario.findOne({ email });

        if (!usuario) {
            return res.status(404).send({status:'Error 404', header: 'Email no encontrado' ,message: 'Verifica tu email' });
        }


        // Buscar perfil asociado (Administrador o Empleado)
        const perfil =
            (await Administrador.findOne({ idUsuario: usuario._id })) ||
            (await Cliente.findOne({ idUsuario: usuario._id })) ||
            (await Empleado.findOne({ idUsuario: usuario._id }));

        if (!perfil) {
            return res.status(403).send({ message: 'Perfil no autorizado' });
        }

        // Verificar roles permitidos
        if (perfil.rol !== 'Administrador' && perfil.rol !== 'Empleado' && perfil.rol !== 'Cliente') { //"estrictamente diferente" de manera que los roles podrian ser cualquier dato no tan explicito
            return res.status(403).send({ message: 'Rol no permitido' });
        }

         // 1. Generar una contraseña temporal aleatoria
         const nuevaPasswordTemporal = crypto.randomBytes(6).toString('hex')+"Nd0"; // Ej: "a1b2c3d4"

         // 2. Hashear la nueva contraseña temporal
         const hashedPassword = await bcrypt.hash(nuevaPasswordTemporal, 10);
 
         // 3. Guardar la nueva contraseña en la base de datos
         usuario.password = hashedPassword;
         await usuario.save();
 

         // Enviar el correo con el código de verificación
         const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: config.MAIL_APPLICATION,
                pass: config.PASSWOR_APPLICATION,
            },
        });

        const mailOptions = {
            from: config.MAIL_APPLICATION,
            to: usuario.email,
            subject: 'Recuperación de Contraseña',
            text: `Hola. ${perfil.nombre}
            \nSe ha generado una nueva contraseña temporal para tu cuenta: ${usuario.emailApp}
            \nTe recomendamos iniciar sesión y cambiarla de inmediato por una más segura.
            \nTu contraseña de acceso temporal: ${nuevaPasswordTemporal}
            \nSaludos.
            \nEl equipo de NightDays.`,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({
            status: "200 OK",
            header:'Verifica tu email.',
            message:`Se ha enviado una nueva contraseña a: \n ${usuario.email}.`,       
        }) 
    } catch (error) {
        console.error(error);
        res.status(500).send({  status: "500 Error Interno",
            header:'Fallo en el servidor',message: 'Error interno del servidor' });
    }
}



module.exports = {
    registroUsuario,
    verificarUsuario,
    logIn,
    eliminarUsuario,
    todosLosUsuarios,
    emailDisponible,
    recuperarPassword,
 
}

//NOTAS:

//Por si se requiere convertir alguna imagen a base64
// const imageBuffer = req.file.buffer; // Suponiendo que req.file contiene los datos de la imagen
// const base64String = bufferToBase64(imageBuffer);
// function bufferToBase64(buffer) {
//     return buffer.toString('base64'); 
// }

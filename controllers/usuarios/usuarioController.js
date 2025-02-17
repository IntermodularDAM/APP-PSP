 
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
        let password;
        console.log(data);

        //Verificar si estan todos los campos
        await body('email').notEmpty().withMessage('El campo "email" es requerido').isEmail().withMessage('El campo "email" debe ser un email válido').run(req);
        //await body('password').notEmpty().withMessage('El campo "password" es requerido').run(req);
 
        const errors = validationResult(req);
        if (!errors.isEmpty()) {  
            return res.status(400).json({
                status: '400 BAD REQUEST',
                message: 'API: Errores de validación',
                errors: errors.array()
            });
        }

                // Buscar usuario en la colección de usuarios
        const preUsuario = await Usuario.findOne({email : data.email});

        if (preUsuario) {
            return res.status(404).send({
                StatusCode:'Error 404' ,
                ReasonPhrase: 'Email ya existe',
                Content: 'Esta email ya esta registrado'
            });
        }

   

        if(data.privileges != null){
            console.log("Registro tardio.");
            password = crypto.randomBytes(6).toString('hex')+"Nd0";
        }
        if(data.privileges == null){
            console.log("Registro normal.");
            password = data.password
        }



        // Generar un código único y su fecha de expiración
        const verificationCode = crypto.randomInt(100000, 999999).toString(); // Código numérico de 6 dígitos
        const expirationTime = Date.now() + 10 * 60 * 1000; // Expira en 10 minutos

    
       //Encriptar la contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        let usuario = new Usuario({
            _id: data._id,
            email: data.email,
            password: hashedPassword,
            verificationCode: verificationCode,
            codeExpiresAt: expirationTime,
            privileges: data.privileges,
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
            \nTu contraseña de acceso: ${password}
            \nTe recomendamos que cambies tu contraseña lo antes posible que esta es temporal.
            \nGracias por registrarte.`,
        };

        await transporter.sendMail(mailOptions);

        console.log("Usuario Creado: "+savedUser)

        res.status(200).json({
            status: "200 OK",
            message: "API : Usuario guardado exitosamente",
            data: { 
                email:savedUser.email,
                emailApp:savedUser.emailApp,
                id:savedUser._id,
                privileges:savedUser.privileges
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
        const user = await Usuario.findOne({ emailApp: emailApp, _id:_id });

        if (!user) {
            return res.status(404).json({
                StatusCode: "404 NOT FOUND",
                ReasonPhrase: "API : Usuario no encontrado",
                Content: "Verifica tus credenciales",
            });
        }

        // Verificar si el código coincide y no ha expirado
        if (user.verificationCode !== verificationCode) {
            return res.status(400).json({
                StatusCode: "400 BAD REQUEST",
                ReasonPhrase: "API : Código de verificación incorrecto",
                Content: "Verifica tu código de verificación.",
            });
        }

        if (user.codeExpiresAt < Date.now()) {
            return res.status(400).json({
                StatusCode: "400 BAD REQUEST",
                ReasonPhrase: "API : El código de verificación ha expirado",
                Content: "Te has quedado sin perfil pide uno nuevo.",
            });
        }

        // Actualizar el estado del usuario a verificado
        user.verificationCode = null;
        user.codeExpiresAt = null;
        user.isVerified = true; // Agrega este campo en el esquema si no existe
        await user.save();

        let rol;
        let TemporalToken;

        if(user.privileges != null){
            rol = user.privileges == true ? "Administrador" : "Empleado";
            TemporalToken  = service.createToken(user._id, rol);



        }else if(user.privileges == null){
            rol = null;
            TemporalToken = null;
        }

        

        res.status(200).json({
            status: "200 OK",
            message: "API : Usuario verificado exitosamente",
            data: {
                emailApp:user.emailApp,
                idUsuario:user._id,
                privileges: rol,
                temporalToken: TemporalToken
            }
        });
    } catch (error) {
        res.status(500).json({
            StatusCode: "500 INTERNAL SERVER ERROR",
            ReasonPhrase: `API : Error al verificar el usuario: ${error.message}`,
            Content: "No se que poner aqui.",
        });
    }
}

async function logIn(req, res){

    try {
        console.log("Se intento login")

        const { email, password, appType } = req.body;

        // Validación rápida de appType antes de consultar la DB
        if (!appType || (appType !== "wpf" && appType !== "android")) {
            return res.status(400).send({
                StatusCode: "Error 400",
                ReasonPhrase: "Parámetro inválido",
                Content: "Debes especificar si la app es 'wpf' o 'android'.",
            });
        }

        // Determinar el campo de búsqueda según el tipo de app
        const query = appType === "wpf" ? { emailApp: email } : { email: email };

        // Buscar usuario en la colección de usuarios
        const usuario = await Usuario.findOne(query);

        if (!usuario) {
            return res.status(404).send({
                StatusCode:'Error 404' ,
                ReasonPhrase: 'Email no encontrado',
                Content: 'Revisa tu email'
            });
        }

        // Verificar contraseña
        const passwordMatch = await bcrypt.compare(password, usuario.password);
        if (!passwordMatch) {
            return res.status(401).send({
                StatusCode:'Error 404' , 
                ReasonPhrase: 'Contraseña incorrecta', 
                Content: 'Revisa tu contraseña'
            });
        }

        // Validar si el usuario tiene privilegios (si es de registro tardio)
        if(usuario.privileges != null && usuario.isVerified == false){

            let rol = usuario.privileges == true ? "Administrador" : "Empleado";
            console.log(usuario)

            return res.status(200).json({
                status: "200 OK 1/2",
                message:'Perfiliar',
                data : { 
                    email: usuario.email,
                    id: usuario._id,
                    emailApp:usuario.emailApp,
                    privileges:rol
                }
               
            }) 
        }else{
            console.log("Usurio Altificado: "+usuario.privileges)
        }

      

        console.log(usuario._id);
        // Buscar perfil asociado (Administrador o Empleado)
        const perfil =
            (await Administrador.findOne({ idUsuario: usuario._id })) ||
            (await Empleado.findOne({ idUsuario: usuario._id })) ||
            (await Cliente.findOne({ idUsuario: usuario._id })) ;

        if (!perfil) {
            return res.status(403).send({
                StatusCode:'Error 403' , 
                ReasonPhrase: 'Perfil no encontrado',
                Content: 'No existe perfil asociado al usuario .-.' 
            });
        }

        console.log(perfil._id);

        // Verificar roles permitidos
        // if (perfil.rol !== 'Administrador' && perfil.rol !== 'Empleado') {
        //     return res.status(403).send({
        //         StatusCode:'Error 403' , 
        //         ReasonPhrase: 'Rol no permitido',
        //         Content: 'No coincide el rol asignado .-.' 
        //     });
        // }

        //Validación de acceso según la app
        if ((appType === "wpf" && perfil.rol === "Cliente") || 
            (appType === "android" && perfil.rol !== "Cliente")) {
                console.log("appType? "+ appType);
            return res.status(403).send({
                StatusCode: "Error 403",
                ReasonPhrase: "Acceso denegado",
                Content: `El rol ${perfil.rol} no tiene acceso a ${appType}.`,
            });
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
        res.status(500).send({
            StatusCode:'Error 500' , 
            ReasonPhrase: 'Error interno del servidor',
            Content: 'Estamos trabando en ello.'
         });
    }
}

async function eliminarUsuario(req,res){

    const  _emailApp  = req.body.emailApp;
    console.log(_emailApp)
    try{
        const user = await Usuario.deleteOne({emailApp :_emailApp});
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
    console.log("Se intento all uers")
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
        console.log("Eeorr")
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

        const  emailApp  = req.body.email;
        console.log(emailApp)

        // Buscar usuario en la colección de usuarios
        const usuario = await Usuario.findOne({ emailApp });

        if (!usuario) {
            return res.status(404).send({status:'Error 404', header: 'Email no encontrado' ,message: 'Verifica tu email' });
        }

        console.log(usuario.email)

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

async function cambiarPassword(req, res){

    try {
        console.log("Se intento cambio")

        const email  = req.body.email;
        const emailApp = req.body.emailApp;
        const password = req.body.password;
        console.log(email)

        // Buscar usuario en la colección de usuarios
        const usuario = await Usuario.findOne({ emailApp: emailApp });

        if (!usuario) {
            return res.status(404).send({
                StatusCode:'Error 404', 
                ReasonPhrase: 'Email no encontrado' ,
                Content: 'Verifica tu email' });
        }

        // Buscar perfil asociado (Administrador o Empleado)
        const perfil =
            (await Administrador.findOne({ idUsuario: usuario._id })) ||
            (await Cliente.findOne({ idUsuario: usuario._id })) ||
            (await Empleado.findOne({ idUsuario: usuario._id }));

        if (!perfil) {
            return res.status(403).send({
                StatusCode:'Error 404', 
                ReasonPhrase:'Error',
                Content: 'Perfil no autorizado para cambio' 
            });
        }

        // Verificar roles permitidos
        if (perfil.rol !== 'Administrador' && perfil.rol !== 'Empleado' && perfil.rol !== 'Cliente') { //"estrictamente diferente" de manera que los roles podrian ser cualquier dato no tan explicito
            return res.status(403).send({
                StatusCode:'Error 404', 
                ReasonPhrase: 'Rol no permitido',
                Content:'No tienes la autorización requerida'
            });
        }


         // 1. Hashear la nueva contraseña
         const hashedPassword = await bcrypt.hash(password, 10);
 
         // 2. Guardar la nueva contraseña en la base de datos
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
            subject: 'Cambio de Contraseña',
            text: `Hola. ${perfil.nombre}
            \nSe ha generado un cambio contraseña en tu cuenta corporativa: ${usuario.emailApp}
            \nTu contraseña de acceso: ${password}
            \nSaludos.
            \nEl equipo de NightDays.`,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({
            StatusCode: "200 OK",
            ReasonPhrase:'Contraseña Cambiada.',
            Content:`Confirmación en tu cuenta personal: \n ${usuario.email}.`,       
        }) 
    } catch (error) {
        console.error(error);
        res.status(500).send({  StatusCode: "500 Error Interno",
            ReasonPhrase:'Fallo en el servidor',Content: 'Error interno del servidor' });
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
    cambiarPassword,
 
}

//NOTAS:

//Por si se requiere convertir alguna imagen a base64
// const imageBuffer = req.file.buffer; // Suponiendo que req.file contiene los datos de la imagen
// const base64String = bufferToBase64(imageBuffer);
// function bufferToBase64(buffer) {
//     return buffer.toString('base64'); 
// }
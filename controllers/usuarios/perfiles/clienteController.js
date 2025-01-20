'use strict'

const Cliente = require("../../../models/usuarios/perfiles/cliente")
const Usuario = require("../../../models/usuarios/usuario");
const sharp = require('sharp')
const fs = require('fs')
const { body, validationResult } = require('express-validator');
const fsextra = require('fs-extra');
const path = require('path');


async function RegistrarCliente(req, res) {
 
    try {

        const data = req.body;
        const file = req.file

        console.log("Data: ", JSON.stringify(data, null, 2));
        console.log("File: "+file)
    
        await body('idUsuario').notEmpty().withMessage('El campo "idUsuario" es requerido').run(req);
        await body('nombre').notEmpty().withMessage('El campo "idUsuario" es requerido').run(req);
        await body('apellido').notEmpty().withMessage('El campo "password" es requerido').run(req);
        await body('rol').notEmpty().withMessage('El campo "password" es requerido').run(req);
        await body('dni').notEmpty().withMessage('El campo "password" es requerido').run(req);
        await body('date').notEmpty().withMessage('El campo "password" es requerido').run(req);
        await body('ciudad').notEmpty().withMessage('El campo "password" es requerido').run(req);
        await body('sexo').notEmpty().withMessage('El campo "password" es requerido').run(req);
      
        const errors = validationResult(req);
        if (!errors.isEmpty()) { 
            return res.status(400).json({
                status: '400 BAD REQUEST',
                message: 'API: Errores de validación',
                errors: errors.array()
            });
        }
        if(!req.file){
            return res.status(400).json({
                status: '400 BAD REQUEST',
                message: 'Falta imagen'
            });
        }


        //Verificar si ya existe un usuario
        const existingUser = await Usuario.findOne({ _id: data.idUsuario });

        if (!existingUser) {
            return res.status(400).json({
                status: '400 BAD REQUEST',
                message: 'No existe el Usuario'
            });
        }

        const imageBuffer = req.file.buffer; // Suponiendo que req.file contiene los datos de la imagen
        const base64String = bufferToBase64(imageBuffer);
        console.log(base64String);

        const sharpFile = sharp(req.file.buffer).resize(200, 200, { fit: 'cover' })
        const sharpEnd = await sharpFile.toBuffer()
    
        // Crear la carpeta personalizada
        const userFolderPath = path.join('uploads', data.idUsuario)
        await fsextra.ensureDir(userFolderPath)
    
        // Generar un nombre único para la imagen
        const fileExtension = path.extname(file.originalname)
        const fileName = `picture_${Date.now()}${fileExtension}`
        let filePath = path.join(userFolderPath, fileName)
        // Cambiar las barras invertidas (\) por barras normales (/)
        filePath = filePath.replace(/\\/g, '/');
    
        console.log(filePath)
        
        await new Promise((resolve, reject) => {
            fs.writeFile(filePath, sharpEnd, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
            });
        });
    
       

        let cliente = new Cliente({
            _id: data._id,
            idUsuario: data.idUsuario,
            nombre:data.nombre,
            apellido: data.apellido,
            rol: data.rol,
            dni:data.dni,
            date:data.date,
            ciudad:data.ciudad,
            sexo:data.sexo,
            rutaFoto:filePath,
    
        });

        const savedUser = await cliente.save();

        res.status(200).json({
            status: "200 OK",
            message: "Cliente guardado exitosamente",
            data: {user:savedUser}
        });

    } catch (error) {
        res.status(500).json({
            status: '500 ERROR INTERNO DE SERVIDOR',
            message: `Error al intentar guardar el Cliente: ${error.message}`
        });
    }

}

function bufferToBase64(buffer) {
    return buffer.toString('base64');
}

async function AllClientes(req, res) {
    try{
        const clientes = await Cliente.find()
        return !clientes ? 
        res.status(404).json({ 
            status: '404 NOT FOUND',
            message : 'API : No existen Clientes'
         })
        : res.status(200).json({
            status: '200 OK',
            data: clientes
        })
    }catch(error){
        return res.status(500).json({
            status: '500 ERROR INTERNO DE SERVIDOR',
            message: `API : Error al realizar la operación. : ${error}`
        })
    }
}

async function EditarCliente(req,res){
    
    const  userId  = req.params.userID;
    const cuerpo = req.body;

    // Validar el cuerpo
    const camposPermitidos = ['nombre', 'apellido', 'correo', 'password','amigos','seguidores','picture'];
    const camposInvalidos = Object.keys(cuerpo).filter((campo) => !camposPermitidos.includes(campo));
    
    if (camposInvalidos.length > 0) {
        return res.status(400).json({
        status: '400 BAD REQUEST',
        message: `CAMPOS NO PERMITIDOS: ${camposInvalidos.join(', ')}`,
        });
    }
    
    try {
        const userUpdated = await User.findByIdAndUpdate(userId, cuerpo, { new: true }).lean()
        return !userUpdated ?  res.status(404).json({
                status: '404 NOT FOUND',
                message: 'EL USUARIO NO EXISTE'
            })
        :
        res.status(200).json({ 
            status: "200 OK",
            user: userUpdated 
        });
    }
      
    catch (error) {
        return res.status(500).json({
            status: '500 ERROR INTERNO DE SERVIDOR',
            message: `ERROR AL REALIZAR LA OPERACION : ${error}`
        })
    }
}

module.exports = {
    RegistrarCliente,
    AllClientes,
    EditarCliente,
    
}
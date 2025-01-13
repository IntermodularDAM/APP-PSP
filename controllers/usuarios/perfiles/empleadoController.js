'use strict'

const Empleado = require("../../../models/usuarios/perfiles/empleado")
const Usuario = require("../../../models/usuarios/usuario");
const sharp = require('sharp')
const fs = require('fs')
const { body, validationResult } = require('express-validator');
const fsextra = require('fs-extra');
const path = require('path');


async function RegistrarEmpleado(req, res) {
 
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
        const filePath = path.join(userFolderPath, fileName)
    
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
    
       

        let empleado = new Empleado({
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

        const savedUser = await empleado.save();

        res.status(200).json({
            status: "200 OK",
            message: "Empleado guardado exitosamente",
            data: {user:savedUser}
        });

    } catch (error) {
        res.status(500).json({
            status: '500 ERROR INTERNO DE SERVIDOR',
            message: `Error al intentar guardar el empleado: ${error.message}`
        });
    }

}

function bufferToBase64(buffer) {
    return buffer.toString('base64');
}


module.exports = {
    RegistrarEmpleado,
}
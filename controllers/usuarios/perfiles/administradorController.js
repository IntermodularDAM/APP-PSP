'use strict'

const Administrador = require("../../../models/usuarios/perfiles/administrador")
const Usuario = require("../../../models/usuarios/usuario");
const sharp = require('sharp')
const fs = require('fs')
const { body, validationResult } = require('express-validator');
const fsextra = require('fs-extra');
const path = require('path');


async function GuardarAdministrador(req, res) {
 
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


        //Verificar si ya existe un usuario con el mismo correo electrónico
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
    
       

        let administrador = new Administrador({
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

        const savedUser = await administrador.save();

        res.status(200).json({
            status: "200 OK",
            message: "Administrador guardado exitosamente",
            data: {user:savedUser}
        });

    } catch (error) {
        res.status(500).json({
            status: '500 ERROR INTERNO DE SERVIDOR',
            message: `Error al intentar guardar el Administrador: ${error.message}`
        });
    }

}

function bufferToBase64(buffer) {
    return buffer.toString('base64');
}

async function AllAdministradores(req, res) {
    try{
        
        const administradores = await Administrador.find()
        return !administradores ? 
        res.status(404).json({ 
            status: '404 NOT FOUND',
            message : 'API : No existen Administradores'
         })
        : res.status(200).json({
            status: '200 OK',
            data: administradores
        })
    }catch(error){
        return res.status(500).json({
            status: '500 ERROR INTERNO DE SERVIDOR',
            message: `API : Error al realizar la operación. : ${error}`
        })
    }
}

async function EditarAdministrador(req,res){
   
    const  perfilID  = req.params.id;
    const cuerpo = req.body;
    const file = req.file;

    // Validar el cuerpo
    const camposPermitidos = ['nombre', 'apellido', 'dni', 'date','ciudad','sexo'];
    const camposInvalidos = Object.keys(cuerpo).filter((campo) => !camposPermitidos.includes(campo));
    
    if (camposInvalidos.length > 0) {
        return res.status(400).json({
        status: '400 BAD REQUEST',
        message: `CAMPOS NO PERMITIDOS: ${camposInvalidos.join(', ')}`,
        });
    }

    const existingAdministador = await Administrador.findOne({ _id: perfilID });
    
    if (!existingAdministador) {
        return res.status(400).json({
            status: '400 BAD REQUEST',
            message: 'No existe el Usuario'
        });
    }

    let filePath = existingAdministador.rutaFoto;
    
    if(file){

        try {
            await fsextra.remove(existingAdministador.rutaFoto);

        } catch (removeError) {
            console.error("Error al intentar eliminar el archivo:", removeError.message);
        }

        const sharpFile = sharp(req.file.buffer).resize(200, 200, { fit: 'cover' })
        const sharpEnd = await sharpFile.toBuffer()
    
        // Crear la carpeta personalizada
        const userFolderPath = path.join('uploads', existingAdministador.idUsuario)
        await fsextra.ensureDir(userFolderPath)
    
        // Generar un nombre único para la imagen
        const fileExtension = path.extname(file.originalname)
        const fileName = `picture_${Date.now()}${fileExtension}`
         filePath = path.join(userFolderPath, fileName).replace(/\\/g, '/');
        // Cambiar las barras invertidas (\) por barras normales (/)


        
        await new Promise((resolve, reject) => {
            fs.writeFile(filePath, sharpEnd, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
            });
        });
    }
    
    
    try {
        const administradorEdit = await Administrador.findByIdAndUpdate(
            perfilID,{ ...cuerpo, rutaFoto : filePath}, { new: true }).lean()
        return !administradorEdit ?  res.status(404).json({
                status: '404 NOT FOUND',
                message: 'EL USUARIO NO EXISTE'
            })
        :
        res.status(200).json({ 
            status: "200 OK",
            user: administradorEdit 
        });
    }
      
    catch (error) {
        return res.status(500).json({
            status: '500 ERROR INTERNO DE SERVIDOR',
            message: `ERROR AL REALIZAR LA OPERACION : ${error}`
        })
    }
}

async function BuscarAdministrador(req, res) {
    const cuerpo = req.body

    // Validar el cuerpo
    const camposPermitidos = ['nombre', 'dni', 'date','ciudad','rol'];
    const camposInvalidos = Object.keys(cuerpo).filter((campo) => !camposPermitidos.includes(campo));
    
    if (camposInvalidos.length > 0) {
        return res.status(400).json({
        status: '400 BAD REQUEST',
        message: `CAMPOS NO PERMITIDOS: ${camposInvalidos.join(', ')}`,
        });
    }

    try {
        // Realizar la búsqueda directamente con el cuerpo
        const administrador = await Administrador.find(cuerpo);

        // Validar si hay resultados
        if (administrador.length === 0) {
            return res.status(404).json({
                status: '404 NOT FOUND',
                message: 'No se encontraron administrador(es) con los criterios proporcionados.',
            });
        }

        // Responder con los empleados encontrados
        return res.status(200).json({
            status: '200 OK',
            message: 'Adminitrador(es) encontrado(s).',
            data: administrador,
        });
    } catch (error) {
        // Manejo de errores
        return res.status(500).json({
            status: '500 INTERNAL SERVER ERROR',
            message: `Error al buscar adminitrador(es): ${error.message}`,
        });
    }

}

module.exports = {
    GuardarAdministrador,
    AllAdministradores,
    EditarAdministrador,
    BuscarAdministrador,
}




'use strict'

const Empleado = require("../../../models/usuarios/perfiles/empleado")
const Usuario = require("../../../models/usuarios/usuario");
const sharp = require('sharp')
const fs = require('fs')
const { body, validationResult } = require('express-validator');
const fsextra = require('fs-extra');
const path = require('path');
const service = require('../../../services');
const { Console } = require("console");


async function RegistrarEmpleado(req, res) {
 
    let filePath ;
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
        filePath = path.join(userFolderPath, fileName)

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

        if(existingUser.privileges != null){

            const Token = service.createToken(existingUser._id, savedUser.rol);
            const AppToken = service.createSimpleToken();

           return res.status(200).json({
                status: "200 OK",
                message: "Empleado guardado exitosamente origen Pre-Registro",
                token: Token,
                appToken: AppToken,
                data: {user:savedUser}
            });
        }

        res.status(200).json({
            status: "200 OK",
            message: "Empleado guardado exitosamente origen Registro",
            data: {user:savedUser}
        });

    } catch (error) {
        // Si se creó un archivo, eliminarlo
        if (filePath) {
            try {
                await fsextra.remove(filePath);
                console.log("Archivo eliminado debido a un error.");
            } catch (removeError) {
                console.error("Error al intentar eliminar el archivo:", removeError.message);
            }
        }
        res.status(500).json({
            status: '500 ERROR INTERNO DE SERVIDOR',
            message: `Error al intentar guardar el empleado: ${error.message}`
        });
    }

}

function bufferToBase64(buffer) {
    return buffer.toString('base64');
}

async function AllEmpleados(req, res) {
    try{
        const empleados = await Empleado.find()
        return !empleados ? 
        res.status(404).json({ 
            status: '404 NOT FOUND',
            message : 'API : No existen Empleados'
         })
        : res.status(200).json({
            status: '200 OK',
            data: empleados
        })
    }catch(error){
        return res.status(500).json({
            status: '500 ERROR INTERNO DE SERVIDOR',
            message: `API : Error al realizar la operación. : ${error}`
        })
    }
}

async function EditarEmpleado(req,res){
   
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

    const existingEmpleado = await Empleado.findOne({ _id: perfilID });
    
    if (!existingEmpleado) {
        return res.status(400).json({
            status: '400 BAD REQUEST',
            message: 'No existe el Usuario'
        });
    }

    let filePath = existingEmpleado.rutaFoto;
    
    if(file){

        try {
            await fsextra.remove(existingEmpleado.rutaFoto);

        } catch (removeError) {
            console.error("Error al intentar eliminar el archivo:", removeError.message);
        }

        const sharpFile = sharp(req.file.buffer).resize(200, 200, { fit: 'cover' })
        const sharpEnd = await sharpFile.toBuffer()
    
        // Crear la carpeta personalizada
        const userFolderPath = path.join('uploads', existingEmpleado.idUsuario)
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
        const empleadoEdit = await Empleado.findByIdAndUpdate(
            perfilID,{ ...cuerpo, rutaFoto : filePath}, { new: true }).lean()
        return !empleadoEdit ?  res.status(404).json({
                status: '404 NOT FOUND',
                message: 'EL USUARIO NO EXISTE'
            })
        :
        res.status(200).json({ 
            status: "200 OK",
            user: empleadoEdit 
        });
    }
      
    catch (error) {
        return res.status(500).json({
            status: '500 ERROR INTERNO DE SERVIDOR',
            message: `ERROR AL REALIZAR LA OPERACION : ${error}`
        })
    }
}

async function BuscarEmpleado(req, res) {
    const cuerpo = req.body

    // Validar el cuerpo
    const camposPermitidos = ['nombre', 'dni', 'date','baja','rol'];
    const camposInvalidos = Object.keys(cuerpo).filter((campo) => !camposPermitidos.includes(campo));
    
    if (camposInvalidos.length > 0) {
        return res.status(400).json({
        status: '400 BAD REQUEST',
        message: `CAMPOS NO PERMITIDOS: ${camposInvalidos.join(', ')}`,
        });
    }

    try {

        let filtro = { ...cuerpo }; // Copiamos todo el cuerpo

        // Manejo especial del campo "baja"
        if ("baja" in cuerpo) {
            if (cuerpo.baja === "true") {
                filtro.baja = { $exists: true, $ne: null }; // Administradores dados de baja
            } 
        }
        // Realizar la búsqueda directamente con el cuerpo
        const empleados = await Empleado.find(filtro);

        // Validar si hay resultados
        if (empleados.length === 0) {
            return res.status(404).json({
                status: '404 NOT FOUND',
                message: 'No se encontraron empleados con los criterios proporcionados.',
            });
        }

        // Responder con los empleados encontrados
        return res.status(200).json({
            status: '200 OK',
            message: 'Empleados encontrados.',
            data: empleados,
        });
    } catch (error) {
        // Manejo de errores
        return res.status(500).json({
            status: '500 INTERNAL SERVER ERROR',
            message: `Error al buscar empleados: ${error.message}`,
        });
    }

}

async function eliminarEmpleado(req, res) {
    const perfilID = req.body._id;

    console.log(perfilID);
    // Verificar si el administrador existe
    const existingEmpleado = await Empleado.findById(perfilID);
    
    if (!existingEmpleado) {
        return res.status(404).json({
            StatusCode: '404 NOT FOUND',
            ReasonPhrase: 'El empleado no existe',
            Content:'Existe un error con el ID'
        });
    }

    const seEliminoAntes = await Usuario.findById(existingEmpleado.idUsuario);

    if(seEliminoAntes.password == ""){
        return res.status(404).json({
            StatusCode: '404 NOT FOUND',
            ReasonPhrase: 'Empleado de baja',
            Content:`Fecha de baja ${existingEmpleado.baja} `
        });
    }

    try {

        // Obtener la fecha en formato DD/MM/YYYY
        const fechaBaja = new Date().toLocaleDateString('es-ES');
        // Actualizar el campo 'baja' con la fecha actual
        const empleadoEliminado = await Empleado.findByIdAndUpdate(
            perfilID,
            { baja: fechaBaja },  // Se actualiza el campo 'baja' con la fecha actual
            { new: true }          // Para devolver el documento actualizado
        ).lean();

        // Actualizar la contraseña vacía en Usuario
        await Usuario.findByIdAndUpdate(
            empleadoEliminado.idUsuario, // Buscar el usuario relacionado
            { password: 'ClaveMaestra' }, // Dejar la contraseña vacía
            { new: true }
        );

        return res.status(200).json({
            StatusCode: "200 OK",
            ReasonPhrase: 'Eliminación exitosa.',
            Content: `El perfil empleado de ${empleadoEliminado.nombre} con ID: ${empleadoEliminado._id}, ha sido eliminado.`
        });
    } catch (error) {
        return res.status(500).json({
            StatusCode: '500 ERROR INTERNO DE SERVIDOR',
            ReasonPhrase: `ERROR AL REALIZAR LA OPERACIÓN: ${error}`,
            Content: "Llama al programador .-."
        });
    }
} 

module.exports = {
    RegistrarEmpleado,
    AllEmpleados,
    EditarEmpleado,
    BuscarEmpleado,
    eliminarEmpleado,
}
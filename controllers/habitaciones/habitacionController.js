const Habitacion = require('../../models/habitaciones/habitaciones');
const { body, validationResult } = require('express-validator'); 

const crearHabitacion = async (req, res) => {
    try {
        const { _id, num_planta, nombre, tipo, capacidad, descripcion, opciones, precio_noche, precio_noche_original, tieneOferta, estado, imagenBase64 } = req.body;
        const habitacion = new Habitacion({ _id, num_planta, nombre, tipo, capacidad, descripcion, opciones, precio_noche, precio_noche_original, tieneOferta, estado, imagenBase64 });
        await habitacion.save();
        res.status(201).json(habitacion);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Obtener todas los empleados (GET)
const obtenerHabitaciones = async (req, res) => {
    try {
        console.log("Entro en el obtener habitaciones.");
        const habitaciones = await Habitacion.find();
        console.log("Habitaciones recogidas.");
        res.status(200).json(habitaciones);
    } catch (error) {
        console.error("Fallo al obtener habitaciones. " + error);
        res.status(500).json({ error: error.message });
    }
};

// Obtener una reserva por ID (GET)
const obtenerHabitacionPorId = async (req, res) => {
    const { _id } = req.params;
    try {
        const habitacion = await Habitacion.findOne({ _id });
        if (!habitacion) {
            return res.status(404).json({ error: 'Habitacion no encontrada' });
        }
        res.status(200).json(habitacion);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

async function actualizarHabitacion(req, res) {
    try {
        // Validación de campos requeridos
        await body('_id').notEmpty().withMessage('El campo "_id" es requerido').run(req);
        await body('num_planta').notEmpty().withMessage('El campo "num_planta" es requerido').run(req);
        await body('nombre').notEmpty().withMessage('El campo "nombre" es requerido').run(req);
        await body('tipo').notEmpty().withMessage('El campo "tipo" es requerido').run(req);
        await body('capacidad').notEmpty().withMessage('El campo "capacidad" es requerido').run(req);
        await body('descripcion').notEmpty().withMessage('El campo "descripcion" es requerido').run(req);
        //await body('precio_noche').notEmpty().withMessage('El campo "precio_noche" es requerido').run(req);

        // Obtener los errores de validación
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: '400 BAD REQUEST',
                message: 'API: Errores de validación',
                errors: errors.array()
            });
        }

        // Desestructuramos los datos enviados en la solicitud
        const { _id, num_planta, nombre, tipo, capacidad, descripcion, opciones, imagenBase64 } = req.body;

        console.log(`Recibiendo datos de la habitación:`, req.body);

        // Buscar la habitación en la base de datos
        const habitacion = await Habitacion.findOne({ _id: String(_id) });
        if (!habitacion) {
            return res.status(404).json({
                status: '404 NOT FOUND',
                message: `No se ha encontrado la habitación con el ID ${_id}.`
            });
        }

        // Mostrar los valores previos de la habitación antes de realizar cambios
        console.log(`Habitación encontrada:`, habitacion);

        // Actualización de los demás campos
        let camposActualizados = false;
        if (habitacion.num_planta !== num_planta) {
            console.log(`Actualizando num_planta: ${num_planta}`);
            habitacion.num_planta = num_planta;
            camposActualizados = true;
        }
        if (habitacion.nombre !== nombre) {
            console.log(`Actualizando nombre: ${nombre}`);
            habitacion.nombre = nombre;
            camposActualizados = true;
        }
        if (habitacion.tipo !== tipo) {
            console.log(`Actualizando tipo: ${tipo}`);
            habitacion.tipo = tipo;
            camposActualizados = true;
        }
        if (habitacion.capacidad !== capacidad) {
            console.log(`Actualizando capacidad: ${capacidad}`);
            habitacion.capacidad = capacidad;
            camposActualizados = true;
        }
        if (habitacion.descripcion !== descripcion) {
            console.log(`Actualizando descripcion: ${descripcion}`);
            habitacion.descripcion = descripcion;
            camposActualizados = true;
        }
        if (JSON.stringify(habitacion.opciones) !== JSON.stringify(opciones)) {
            console.log(`Actualizando opciones: ${JSON.stringify(opciones)}`);
            habitacion.opciones = opciones;
            camposActualizados = true;
        }
        if (imagenBase64) {
            console.log(`Actualizando imagen: ${imagenBase64}`)
            habitacion.imagenBase64 = imagenBase64;
            camposActualizados = true;
        }

        // Actualización de tieneOferta basado en la comparación de precios
        if (habitacion.precio_noche < habitacion.precio_noche_original) {
            console.log('Precio con oferta, actualizando tieneOferta a true');
            habitacion.tieneOferta = true;
            camposActualizados = true;
        } else {
            console.log('Precio sin oferta, actualizando tieneOferta a false');
            habitacion.tieneOferta = false;
            camposActualizados = true;
        }


        // Si alguno de los campos ha cambiado, lo guardamos
        if (camposActualizados) {
            console.log(`Guardando cambios...`);
            await habitacion.save();
        } else {
            return res.status(200).json({
                status: '200 OK',
                message: 'No se realizaron cambios, la habitación ya está actualizada.',
                habitacion
            });
        }

        // Responder con la habitación actualizada
        res.status(200).json({
            status: '200 OK',
            message: 'Habitación modificada exitosamente.',
            habitacion,
        });

    } catch (err) {
        // Manejo de errores
        console.error(err);
        res.status(500).json({
            status: '500 INTERNAL SERVER ERROR',
            message: 'Ocurrió un error al intentar actualizar la habitación.',
            error: err.message
        });
    }
}


// Actualizar parcialmente una reserva (PATCH)
const actualizarHabitacionParcial = async (req, res) => {
    const { _id } = req.params;
    const updates = req.body; // Los campos que se desean actualizar
    try {
        const habitacion = await Habitacion.findOneAndUpdate(_id, updates, { new: true });

        if (!habitacion) {
            return res.status(404).json({ error: 'Habitacion no encontrada' });
        }
        res.status(200).json(habitacion);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

/*
// Eliminar una reserva (DELETE)
const eliminarHabitacion = async (req, res) => {
    const { _id } = req.params;
    try {
        const habitacion = await Habitacion.findOneAndDelete(_id);

        if (!habitacion) {
            return res.status(404).json({ error: 'Habitacion no encontrada' });
        }
        res.status(200).json({ message: 'Habitacion eliminada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};
*/

// Modifica tu ruta para que use params en lugar de body
async function eliminarHabitacion(req, res) {
    try {
        // Obtener el ID desde los parámetros de la URL
        const { id } = req.params;

        console.log(`Buscando la habitación con ID: ${id}`);

        // Buscar la habitación en la base de datos
        const habitacion = await Habitacion.findOne({ _id: String(id) });
        if (!habitacion) {
            return res.status(404).json({
                status: '404 NOT FOUND',
                message: `No se ha encontrado la habitación con el ID ${id}.`
            });
        }

        console.log(`Habitación encontrada:`, habitacion);

        // Eliminar la habitación
        await Habitacion.deleteOne({ _id: String(id) });

        console.log(`Habitación con ID ${id} eliminada exitosamente.`);

        // Respuesta exitosa
        res.status(200).json({
            status: '200 OK',
            message: 'Habitación eliminada exitosamente.',
            habitacion
        });
    } catch (err) {
        // Manejo de errores
        console.error(err);
        res.status(500).json({
            status: '500 INTERNAL SERVER ERROR',
            message: 'Ocurrió un error al intentar eliminar la habitación.',
            error: err.message
        });
    }
}

module.exports = {
    crearHabitacion,
    obtenerHabitaciones,
    obtenerHabitacionPorId,
    actualizarHabitacion,
    actualizarHabitacionParcial,
    eliminarHabitacion
};
const Habitacion = require('../../models/habitaciones/habitacion');
const { body, validationResult } = require('express-validator'); 

const crearHabitacion = async (req, res) => {
    try {
        const { _id, num_planta, tipo, capacidad, descripcion, opciones, precio_noche, precio_noche_original, tieneOferta, estado } = req.body;
        const habitacion = new Habitacion({ _id, num_planta, tipo, capacidad, descripcion, opciones, precio_noche, precio_noche_original, tieneOferta, estado });
        await habitacion.save();
        res.status(201).json(habitacion);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Obtener todas los empleados (GET)
const obtenerHabitaciones = async (req, res) => {
    try {
        const habitaciones = await Habitacion.find();
        res.status(200).json(habitaciones);
    } catch (error) {
        console.error(error);
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
        // ValidaciÃ³n de campos requeridos
        await body('_id').notEmpty().withMessage('El campo "_id" es requerido').run(req);
        await body('num_planta').notEmpty().withMessage('El campo "num_planta" es requerido').run(req);
        await body('tipo').notEmpty().withMessage('El campo "tipo" es requerido').run(req);
        await body('capacidad').notEmpty().withMessage('El campo "capacidad" es requerido').run(req);
        await body('descripcion').notEmpty().withMessage('El campo "descripcion" es requerido').run(req);
        //await body('precio_noche').notEmpty().withMessage('El campo "precio_noche" es requerido').run(req);

        // Obtener los errores de validaciÃ³n
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: '400 BAD REQUEST',
                message: 'API: Errores de validaciÃ³n',
                errors: errors.array()
            });
        }

        // Desestructuramos los datos enviados en la solicitud
        const { _id, num_planta, tipo, capacidad, descripcion, opciones } = req.body;

        console.log(`Recibiendo datos de la habitaciÃ³n:`, req.body);

        // Buscar la habitaciÃ³n en la base de datos
        const habitacion = await Habitacion.findOne({ _id: String(_id) });
        if (!habitacion) {
            return res.status(404).json({
                status: '404 NOT FOUND',
                message: `No se ha encontrado la habitaciÃ³n con el ID ${_id}.`
            });
        }

        // Mostrar los valores previos de la habitaciÃ³n antes de realizar cambios
        console.log(`HabitaciÃ³n encontrada:`, habitacion);

        // ActualizaciÃ³n de los demÃ¡s campos
        let camposActualizados = false;
        if (habitacion.num_planta !== num_planta) {
            console.log(`Actualizando num_planta: ${num_planta}`);
            habitacion.num_planta = num_planta;
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

        /*
         // LÃ³gica de actualizaciÃ³n de precios
         if (!tieneOferta) {
            // Si no tiene oferta, actualizamos el precio_noche_original con el mismo valor de precio_noche
            console.log(`Sin oferta, actualizando precio_noche_original: ${precio_noche}`);
            habitacion.precio_noche = precio_noche;
            habitacion.precio_noche_original = precio_noche;
            camposActualizados = true; // Si no tiene oferta, el precio original es igual al precio de la noche
        } else {
            // Si tiene oferta, actualizamos el precio_noche y precio_noche_original con los valores correspondientes
            console.log(`Con oferta, actualizando precio_noche: ${precio_noche} y precio_noche_original: ${precio_noche_original}`);
            habitacion.precio_noche = precio_noche;
            habitacion.precio_noche_original = precio_noche_original;
            camposActualizados = true;
        }

        // ActualizaciÃ³n del estado
        if (estado !== habitacion.estado) {
            console.log(`Actualizando estado: ${estado}`);
            habitacion.estado = estado; // Si el estado es diferente, actualizamos
            camposActualizados = true;
        }*/

        // Si alguno de los campos ha cambiado, lo guardamos
        if (camposActualizados) {
            console.log(`Guardando cambios...`);
            await habitacion.save();
        } else {
            return res.status(200).json({
                status: '200 OK',
                message: 'No se realizaron cambios, la habitaciÃ³n ya estÃ¡ actualizada.',
                habitacion
            });
        }

        // Responder con la habitaciÃ³n actualizada
        res.status(200).json({
            status: '200 OK',
            message: 'HabitaciÃ³n modificada exitosamente.',
            habitacion,
        });

    } catch (err) {
        // Manejo de errores
        console.error(err);
        res.status(500).json({
            status: '500 INTERNAL SERVER ERROR',
            message: 'OcurriÃ³ un error al intentar actualizar la habitaciÃ³n.',
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
        // Obtener el ID desde los parÃ¡metros de la URL
        const { id } = req.params;

        console.log(`Buscando la habitaciÃ³n con ID: ${id}`);

        // Buscar la habitaciÃ³n en la base de datos
        const habitacion = await Habitacion.findOne({ _id: String(id) });
        if (!habitacion) {
            return res.status(404).json({
                status: '404 NOT FOUND',
                message: `No se ha encontrado la habitaciÃ³n con el ID ${id}.`
            });
        }

        console.log(`HabitaciÃ³n encontrada:`, habitacion);

        // Eliminar la habitaciÃ³n
        await Habitacion.deleteOne({ _id: String(id) });

        console.log(`HabitaciÃ³n con ID ${id} eliminada exitosamente.`);

        // Respuesta exitosa
        res.status(200).json({
            status: '200 OK',
            message: 'HabitaciÃ³n eliminada exitosamente.',
            habitacion
        });
    } catch (err) {
        // Manejo de errores
        console.error(err);
        res.status(500).json({
            status: '500 INTERNAL SERVER ERROR',
            message: 'OcurriÃ³ un error al intentar eliminar la habitaciÃ³n.',
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

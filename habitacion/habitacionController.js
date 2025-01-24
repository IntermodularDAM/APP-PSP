const Habitacion = require('../../models/habitaciones/habitacion');

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
        const habitacion = await Habitacion.findOne(_id);
        if (!habitacion) {
            return res.status(404).json({ error: 'Habitacion no encontrada' });
        }
        res.status(200).json(habitacion);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Actualizar una reserva completamente (PUT)
const actualizarHabitacion= async (req, res) => {
    const { _id } = req.params;
    const { num_planta, tipo, capacidad, descripcion, opciones, precio_noche, precio_noche_original, tieneOferta, estado } = req.body;
    try {
        const habitacion = await Habitacion.findOneAndUpdate({_id}, { 
            num_planta,
            tipo,
            capacidad,
            descripcion,
            opciones,
            precio_noche,
            precio_noche_original,
            tieneOferta,
            estado
        }, { new: true });

        if (!habitacion) {
            return res.status(404).json({ error: 'Habitacion no encontrada' });
        }
        res.status(200).json(habitacion);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

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

module.exports = {
    crearHabitacion,
    obtenerHabitaciones,
    obtenerHabitacionPorId,
    actualizarHabitacion,
    actualizarHabitacionParcial,
    eliminarHabitacion
};

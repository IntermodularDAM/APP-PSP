const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const authz = require('../../middlewares/authz');
const {
    crearHabitacion,
    obtenerHabitaciones,
    obtenerHabitacionPorId,
    actualizarHabitacion,
    actualizarHabitacionParcial,
    eliminarHabitacion
} = require('../../controllers/habitacion/habitacionController');


router.post('/habitaciones', auth, crearHabitacion);

// Obtener todas las reservas (GET)
router.get('/habitaciones', obtenerHabitaciones);

// Obtener una reserva por ID (GET)
router.get('/habitaciones/:id', obtenerHabitacionPorId);

// Actualizar una reserva completamente (PUT)
router.put('/habitaciones/:id', actualizarHabitacion);

// Actualizar parcialmente una reserva (PATCH)
router.patch('/habitaciones/:id', actualizarHabitacionParcial);

// Eliminar una reserva (DELETE)
router.delete('/habitaciones/:id', eliminarHabitacion);

module.exports = router;


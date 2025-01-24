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

// Obtener todas las habitaciones (GET)
router.get('/habitaciones', obtenerHabitaciones);

// Obtener una habitacion por ID (GET)
router.get('/habitaciones/:id', obtenerHabitacionPorId);

// Actualizar una habitacion completamente (PUT)
router.put('/habitaciones/:id', actualizarHabitacion);

// Actualizar parcialmente una habitacion (PATCH)
router.patch('/habitaciones/:id', actualizarHabitacionParcial);

// Eliminar una habitacion (DELETE)
router.delete('/habitaciones/:id', eliminarHabitacion);

module.exports = router;


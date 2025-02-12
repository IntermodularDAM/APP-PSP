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
} = require('../../controllers/habitaciones/habitacionController');


router.post('/habitaciones', crearHabitacion);

// Obtener todas las habitaciones (GET)
router.get('/habitaciones', obtenerHabitaciones);

// Obtener una habitacion por ID (GET)
router.get('/habitaciones/:id', obtenerHabitacionPorId);

// Actualizar una habitacion completamente (PUT)
router.put('/Actualizar/:id', actualizarHabitacion);

// Actualizar parcialmente una habitacion (PATCH)
router.patch('/habitaciones/:id', actualizarHabitacionParcial);

// Eliminar una habitacion (DELETE)
router.delete('/Eliminar/:id', eliminarHabitacion);

module.exports = router;
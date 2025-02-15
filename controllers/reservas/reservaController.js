const Reserva = require('../../models/reservas/reservas');
const Usuario = require('../../models/usuarios/usuario');
const Administrador = require('../../models/usuarios/perfiles/administrador');
const Empleado = require('../../models/usuarios/perfiles/empleado');
const Cliente = require('../../models/usuarios/perfiles/cliente');
const Habitacion  = require('../../models/habitaciones/habitaciones');
const { body, validationResult } = require('express-validator');

async function crearReserva(req, res) {
    try {
        // Validar datos de entrada
        await body('id_usu').notEmpty().withMessage('El campo "id_usu" es requerido').run(req);
        await body('id_hab').notEmpty().withMessage('El campo "id_hab" es requerido').run(req);
        await body('fecha_check_in').notEmpty().withMessage('El campo "fecha_check_in" es requerido').run(req);
        await body('fecha_check_out').notEmpty().withMessage('El campo "fecha_check_out" es requerido').run(req);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: '400 BAD REQUEST',
                message: 'API: Errores de validación',
                errors: errors.array(),
            });
        }

        const { id_usu, id_hab, fecha_check_in, fecha_check_out } = req.body;

        // Verificar si el usuario existe
        const usuario = await Usuario.findOne({ _id: id_usu });
        const administrador = await Administrador.findOne({ _id: id_usu });
        const empleado = await Empleado.findOne({ _id: id_usu });
        const cliente = await Cliente.findOne({ _id: id_usu });
        if (!usuario && !administrador && !empleado && !cliente) {
            return res.status(404).json({
                status: '404 NOT FOUND',
                message: `El usuario con id ${id_usu} no existe.`,
            });
        }

        // Verificar si la habitación existe
        const habitacion = await Habitacion.findOne({ _id: id_hab });
        if (!habitacion) {
            return res.status(404).json({
                status: '404 NOT FOUND',
                message: `La habitación con id ${id_hab} no existe.`,
            });
        }

        // Validar si ya existe una reserva con los mismos parámetros
        const reservaExistente = await Reserva.findOne({
            id_usu: id_usu,
            id_hab: id_hab,
            fecha_check_in: fecha_check_in,
            fecha_check_out: fecha_check_out,
        });

        if (reservaExistente) {
            return res.status(400).json({
                status: '400 BAD REQUEST',
                message: 'La reserva que intenta crear ya existe.',
            });
        }

        // Validar superposición de fechas para la misma habitación
        const overlappingReservas = await Reserva.find({
            id_hab: id_hab,
            $or: [
                { fecha_check_in: { $lte: fecha_check_out }, fecha_check_out: { $gte: fecha_check_in } },
            ],
        });

        if (overlappingReservas.length > 0) {
            return res.status(400).json({
                status: '400 BAD REQUEST',
                message: 'Las fechas de la reserva colisionan con otra reserva existente.',
                overlappingReservas,
            });
        }

        // Crear la reserva si no hay conflictos
        const nuevaReserva = new Reserva(req.body);
        await nuevaReserva.save();

        res.status(201).json({
            status: '201 CREATED',
            message: 'Reserva creada exitosamente.',
            reserva: nuevaReserva,
        });
    } catch (err) {
        res.status(500).json({
            status: '500 INTERNAL SERVER ERROR',
            message: 'Ocurrió un error al crear la reserva.',
            error: err.message,
        });
    }
}

async function modificarReserva(req, res) {
    try {
        // Validaciones de los campos requeridos
        await body('id_usu').notEmpty().withMessage('El campo "id_usu" es requerido').run(req);
        await body('id_hab').notEmpty().withMessage('El campo "id_hab" es requerido').run(req);
        await body('fecha_check_in').notEmpty().withMessage('El campo "fecha_check_in" es requerido').run(req);
        await body('fecha_check_out').notEmpty().withMessage('El campo "fecha_check_out" es requerido').run(req);
        await body('estado_reserva').notEmpty().withMessage('El campo "estado_reserva" es requerido').run(req);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: '400 BAD REQUEST',
                message: 'API: Errores de validación',
                errors: errors.array()
            });
        }

        // Extraer datos del cuerpo de la solicitud
        const { id_usu, id_hab, fecha_check_in, fecha_check_out, estado_reserva } = req.body;

        console.log(`Usuario ${id_usu} encontrado.`);
        console.log(`Habitación ${id_hab} encontrada.`);

        // Buscar la reserva en la base de datos
        const reserva = await Reserva.findOne({ id_usu: id_usu, id_hab: id_hab });
        if (!reserva) {
            return res.status(404).json({
                status: '404 NOT FOUND',
                message: `No se ha encontrado la reserva con el usuario ${id_usu} y la habitación ${id_hab}.`
            });
        }

        // Actualizar los campos de la reserva
        reserva.fecha_check_in = fecha_check_in;
        reserva.fecha_check_out = fecha_check_out;
        reserva.estado_reserva = estado_reserva;

        // Guardar los cambios en la base de datos
        await reserva.save();

        // Responder al cliente con la reserva actualizada
        res.status(200).json({
            status: '200 OK',
            message: 'Reserva modificada exitosamente.',
            reserva,
        });
    } catch (err) {
        // Manejo de errores
        res.status(500).json({
            status: '500 INTERNAL SERVER ERROR',
            message: 'Error al modificar la reserva.',
            error: err.message,
        });
    }
}

async function eliminarReserva(req, res) {
    try {
        const { _id } = req.params;

        const reserva = await Reserva.findById(_id);
        if (!reserva) {
            return res.status(404).json({
                status: '404 NOT FOUND',
                message: `No se encontró una reserva con el ID ${_id}.`
            });
        }

        await Reserva.deleteOne({ _id });

        return res.status(200).json({
            status: '200 OK',
            message: 'Reserva eliminada exitosamente.',
        });
    } catch (err) {
        return res.status(500).json({
            status: '500 INTERNAL SERVER ERROR',
            message: 'Error al eliminar la reserva.',
            error: err.message
        });
    }
}

async function getAllReserva(req, res) {
    try {
        // Buscar todas las reservas en la base de datos
        const reservas = await Reserva.find();

        if (reservas.length === 0) {
            return res.status(404).json({
                status: '404 NOT FOUND',
                message: 'No se encontraron reservas en la base de datos.',
            });
        }

        res.status(200).json({
            status: '200 OK',
            message: 'Reservas obtenidas exitosamente.',
            reservas,
        });
    } catch (err) {
        res.status(500).json({
            status: '500 INTERNAL SERVER ERROR',
            message: 'Ocurrió un error al obtener las reservas.',
            error: err.message,
        });
    }
}

module.exports = {
    crearReserva,
    modificarReserva,
    eliminarReserva,
    getAllReserva,
}